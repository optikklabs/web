import axios from "axios";

import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

import { NETWORK_ERROR, UNKNOWN_ERROR } from "@/shared/constants/errorCodes";

import type { ErrorCode } from "@/shared/constants/errorCodes";

import { session } from "@shared/api/auth/session";
import { toApiErrorShape } from "@shared/api/utils/errorNormalization";
import type { ApiErrorShape } from "@shared/api/utils/errorNormalization";

/** The query API's failure envelope. */
interface ApiFailure {
  readonly error: { readonly code: ErrorCode; readonly message: string };
}

function isApiFailure(data: unknown): data is ApiFailure {
  const error = (data as { error?: unknown } | null)?.error;
  return typeof error === "object" && error !== null && "code" in error && "message" in error;
}

function normalizeError(error: unknown): ApiErrorShape {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const { status, data } = axiosError.response;
      // A failure without the API envelope came from a proxy, not the API.
      if (!isApiFailure(data)) {
        return { status, code: UNKNOWN_ERROR, message: `Request failed with HTTP ${status}`, data };
      }
      return { status, code: data.error.code, message: data.error.message, data };
    }

    if (axiosError.request) {
      return {
        status: 0,
        code: NETWORK_ERROR,
        message: "Network error - please check your connection",
      };
    }

    return {
      status: 0,
      code: UNKNOWN_ERROR,
      message: axiosError.message || "An unexpected error occurred",
    };
  }

  return toApiErrorShape(error);
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export function attachErrorInterceptor(instance: AxiosInstance): number {
  return instance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      // A cancelled request (navigation, a superseded query) is not a failure.
      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const config = error.config as RetriableConfig | undefined;
        // authExempt requests are the auth flow itself (login/refresh/...);
        // retrying them through refresh would recurse.
        if (config && !config._retried && !config.authExempt) {
          const token = await session.refreshAccessToken();
          if (token != null) {
            config._retried = true;
            return instance.request(config);
          }
        }
      }

      const normalized = normalizeError(error);
      // 4xx replies are part of normal flow (an unauthenticated session probe,
      // a missing entity, a rejected form) and the UI surfaces them; only
      // failures the user cannot act on are worth a console entry.
      if (
        normalized.status === 0 ||
        normalized.status >= 500 ||
        normalized.code === UNKNOWN_ERROR
      ) {
        console.error("[API Error]", {
          status: normalized.status,
          code: normalized.code,
          message: normalized.message,
        });
      }
      return Promise.reject(normalized);
    }
  );
}
