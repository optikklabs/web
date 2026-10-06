import type { ExplorerFilter, ExplorerMode } from "../types/filters";

function encodeBase64(value: unknown): string {
  const raw = JSON.stringify(value ?? []);
  return encodeURIComponent(btoa(unescape(encodeURIComponent(raw))));
}

function decodeBase64<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const decoded = decodeURIComponent(raw);
    const json = decodeURIComponent(escape(atob(decoded)));
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function encodeFilters(filters: readonly ExplorerFilter[]): string {
  return encodeBase64(filters);
}

export function decodeFilters(raw: string | null | undefined): ExplorerFilter[] {
  return decodeBase64<ExplorerFilter[]>(raw, []);
}

export function parseMode(raw: string | null | undefined): ExplorerMode {
  return raw === "analytics" ? "analytics" : "list";
}

export function serializeStateSnapshot(value: unknown): string {
  return encodeBase64(value);
}

export function deserializeStateSnapshot<T>(raw: string | null | undefined, fallback: T): T {
  return decodeBase64(raw, fallback);
}

/**
 * Explorer URL params, validated by every route that hosts explorer state
 * (/logs, /traces, service detail tabs). Owned here so the param names have
 * a single authoritative definition next to their encoders.
 */
export interface ExplorerUrlSearch {
  readonly filters?: string;
  readonly mode?: string;
  readonly cursor?: string;
  readonly detail?: string;
}

export function asUrlParamString(value: unknown): string | undefined {
  if (typeof value === "string") return value !== "" ? value : undefined;
  if (typeof value === "number") return String(value);
  return undefined;
}

/** Non-empty string search params (`tab`, `status`, …), for validateSearch. */
export function asSearchString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

/** A search param restricted to `allowed`; anything else is dropped. */
export function asSearchEnum<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T | undefined {
  return allowed.find((a) => a === value);
}

/** validateSearch fragment for routes that host the explorer. */
export function pickExplorerSearch(search: Record<string, unknown>): ExplorerUrlSearch {
  return {
    filters: asUrlParamString(search.filters),
    mode: asUrlParamString(search.mode),
    cursor: asUrlParamString(search.cursor),
    detail: asUrlParamString(search.detail),
  };
}
