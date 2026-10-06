import type { Tenant, User } from "@shared/types";

import { queryClient } from "@shared/api/queryClient";

import { useAppStore } from "@app/store/appStore";
import { useAuthStore } from "@app/store/authStore";

import { clearSignupApiKey, stashSignupApiKey } from "./apiKeyHandoff";
import { AuthError, type SessionPayload, type SignupParams, authApi } from "./authApi";

/**
 * Single owner of the session lifecycle. The access token lives only in this
 * module (never persisted); a page reload recovers it through the httpOnly
 * refresh cookie. All teardown funnels through `endSession`, so token, tenant
 * selection, query cache, and auth state can never drift.
 */

/**
 * The three outcomes of a session restore, passed unchanged to the router.
 * Only `unauthenticated` (a definitive 401) may bounce the user to `/login`;
 * `unavailable` (network/timeout/5xx) leaves any valid session intact so a
 * transient backend blip can never log an active user out.
 */
export type RestoreOutcome = "authenticated" | "unauthenticated" | "unavailable";

let accessToken: string | null = null;
let refreshInflight: Promise<RestoreOutcome> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

// Renew this long before the access token expires, so the refresh happens on a
// healthy session rather than a burst of 401s at the expiry boundary.
const PROACTIVE_REFRESH_LEAD_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 5_000;
// After a transient refresh failure, retry soon rather than dropping the
// session; the current token is still valid for the lead window.
const TRANSIENT_RETRY_DELAY_MS = 10_000;

/** Reads the `exp` claim (ms) from a JWT without verifying it, or null. */
function accessTokenExpiryMs(token: string): number | null {
  const payload = token.split(".")[1];
  if (payload == null) {
    return null;
  }
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function clearRefreshTimer(): void {
  if (refreshTimer != null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function scheduleProactiveRefresh(token: string): void {
  clearRefreshTimer();
  const expiryMs = accessTokenExpiryMs(token);
  if (expiryMs == null) {
    return;
  }
  const delay = Math.max(expiryMs - Date.now() - PROACTIVE_REFRESH_LEAD_MS, MIN_REFRESH_DELAY_MS);
  refreshTimer = setTimeout(runProactiveRefresh, delay);
}

// Drives the proactive refresh loop. A success reschedules itself through
// `beginSession`; a definitive rejection has already ended the session; only a
// transient failure needs an explicit short-delay retry so the loop survives
// backend blips instead of logging the user out.
async function runProactiveRefresh(): Promise<void> {
  if ((await refresh()) === "unavailable") {
    clearRefreshTimer();
    refreshTimer = setTimeout(runProactiveRefresh, TRANSIENT_RETRY_DELAY_MS);
  }
}

function toTenant(payload: SessionPayload): Tenant {
  const { id, name, role, accountStatus, trialEndsAt } = payload.tenant;
  return {
    id,
    name,
    role: role ?? undefined,
    accountStatus: accountStatus ?? undefined,
    trialEndsAt,
  };
}

function toUser(payload: SessionPayload): User {
  const { id, email, name } = payload.user;
  return { id, email, name };
}

function beginSession(payload: SessionPayload): void {
  accessToken = payload.accessToken;
  scheduleProactiveRefresh(payload.accessToken);
  const tenant = toTenant(payload);
  useAppStore.getState().setSelectedTenantId(tenant.id);
  useAuthStore.getState().setSession(toUser(payload), tenant);
}

function endSession(): void {
  accessToken = null;
  clearRefreshTimer();
  clearSignupApiKey();
  useAppStore.getState().setSelectedTenantId(null);
  queryClient.clear();
  useAuthStore.getState().clearSession();
}

// Turns a refresh into the router's vocabulary. Only a definitive rejection
// tears the session down; a transient failure returns `unavailable` and leaves
// the still-valid session untouched.
async function doRefresh(): Promise<RestoreOutcome> {
  try {
    beginSession(await authApi.refresh());
    return "authenticated";
  } catch (error) {
    if (error instanceof AuthError && error.kind === "rejected") {
      endSession();
      return "unauthenticated";
    }
    return "unavailable";
  }
}

// Single-flight refresh: concurrent callers (boot, 401 retries, the proactive
// timer) share one in-flight call so the backend is hit once per refresh window.
// Short-circuits after a definitive logout to avoid hammering a dead session.
function refresh(): Promise<RestoreOutcome> {
  if (useAuthStore.getState().status === "unauthenticated") {
    return Promise.resolve("unauthenticated");
  }
  refreshInflight ??= doRefresh().finally(() => {
    refreshInflight = null;
  });
  return refreshInflight;
}

export const session = {
  getAccessToken(): string | null {
    return accessToken;
  },

  async login(email: string, password: string): Promise<void> {
    beginSession(await authApi.login(email, password));
  },

  async signup(params: SignupParams): Promise<"verificationRequired" | "signedIn"> {
    const result = await authApi.signup(params);
    if (result.kind === "signedIn") {
      beginSession(result.session);
      stashSignupApiKey(result.apiKey);
    }
    return result.kind;
  },

  async verifyEmail(token: string): Promise<void> {
    const { session: payload, apiKey } = await authApi.verifyEmail(token);
    beginSession(payload);
    stashSignupApiKey(apiKey);
  },

  async logout(): Promise<void> {
    try {
      await authApi.logout(accessToken);
    } catch {
      // The local session ends regardless; a failed server revoke only means
      // the refresh token expires on its own.
    }
    endSession();
  },

  async forgotPassword(email: string): Promise<void> {
    await authApi.forgotPassword(email);
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await authApi.resetPassword(token, password);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await authApi.changePassword(currentPassword, newPassword);
  },

  // For the 401-retry interceptor: hand back a token only on a real refresh; a
  // transient failure returns null without tearing down the still-valid session.
  async refreshAccessToken(): Promise<string | null> {
    return (await refresh()) === "authenticated" ? accessToken : null;
  },

  // Boot entry point for the route guards. Returns the real 3-way outcome so a
  // transient failure can be retried instead of forcing a logout.
  restore(): Promise<RestoreOutcome> {
    if (accessToken != null) {
      return Promise.resolve("authenticated");
    }
    return refresh();
  },
};
