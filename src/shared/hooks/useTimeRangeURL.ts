import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import type { RelativeTimeRange, TimeRange } from "@shared/types";

import { TIME_RANGES } from "@config/constants";

import { useAppStore, useTimeRange } from "@app/store/appStore";

const PARAM_FROM = "from";
const PARAM_TO = "to";
const PARAM_TZ = "tz";

const RELATIVE_RE = /^now-(\d+)(m|h|d)$/;

function presetToUrlValue(preset: string): string {
  return `now-${preset}`;
}

function urlValueToPreset(val: string): RelativeTimeRange | null {
  const [, digits = "", unit] = RELATIVE_RE.exec(val) ?? [];
  if (!unit) return null;
  const num = Number.parseInt(digits, 10);
  let minutes: number;
  let presetStr: string;
  switch (unit) {
    case "m":
      minutes = num;
      presetStr = `${num}m`;
      break;
    case "h":
      minutes = num * 60;
      presetStr = `${num}h`;
      break;
    case "d":
      minutes = num * 1440;
      presetStr = `${num}d`;
      break;
    default:
      return null;
  }
  const found = TIME_RANGES.find((r) => r.preset === presetStr);
  if (found) return found;
  return { kind: "relative", preset: presetStr, label: `Last ${num}${unit}`, minutes };
}

function parseUrlTimeRange(from: string | null, to: string | null): TimeRange | null {
  if (!from) return null;

  if (from.startsWith("now-") && (!to || to === "now")) {
    return urlValueToPreset(from);
  }

  const startMs = Number(from);
  const endMs = Number(to);
  if (Number.isFinite(startMs) && Number.isFinite(endMs) && startMs < endMs) {
    return {
      kind: "absolute",
      startMs,
      endMs,
      label: "Custom range",
    };
  }

  return null;
}

/**
 * Absolute bounds are written as numbers: the router JSON-quotes a numeric
 * string to keep its type, which would put `from="123"` in the URL.
 */
function timeRangeToUrlParams(r: TimeRange): { from: string | number; to: string | number } {
  if (r.kind === "relative") {
    return { from: presetToUrlValue(r.preset), to: "now" };
  }
  return { from: r.startMs, to: r.endMs };
}

interface UrlTimeState {
  from: string | null;
  to: string | null;
  tz: string | null;
}

interface UrlWrite {
  from: string | number;
  to: string | number;
  tz: string | null;
}

function resolveUrlWrite(
  timeRange: TimeRange,
  timezone: string,
  url: UrlTimeState
): UrlWrite | null {
  const params = timeRangeToUrlParams(timeRange);
  const expectedTz = timezone !== "local" ? timezone : null;
  if (
    url.from === String(params.from) &&
    url.to === String(params.to) &&
    (url.tz ?? null) === expectedTz
  ) {
    return null;
  }
  return { from: params.from, to: params.to, tz: expectedTz };
}

function resolveStoreWrite(timeRange: TimeRange, url: UrlTimeState): TimeRange | null {
  const parsed = parseUrlTimeRange(url.from, url.to);
  if (!parsed) return null;
  const currentParams = timeRangeToUrlParams(timeRange);
  const parsedParams = timeRangeToUrlParams(parsed);
  if (currentParams.from === parsedParams.from && currentParams.to === parsedParams.to) {
    return null;
  }
  return parsed;
}

type SearchRecord = Record<string, unknown>;

/** The router parses numeric params to numbers; normalize back to strings. */
function paramToString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

/**
 * The global time-range params. Every route that defines `validateSearch`
 * must spread `pickTimeRangeSearch` so in-route navigations preserve them.
 */
export interface TimeRangeSearch {
  readonly from?: string | number;
  readonly to?: string | number;
  readonly tz?: string;
}

function sanitizeTimeRangeParam(value: unknown): string | number | undefined {
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

/** validateSearch fragment for the global time range. */
export function pickTimeRangeSearch(search: SearchRecord): TimeRangeSearch {
  return {
    from: sanitizeTimeRangeParam(search[PARAM_FROM]),
    to: sanitizeTimeRangeParam(search[PARAM_TO]),
    tz: typeof search[PARAM_TZ] === "string" ? (search[PARAM_TZ] as string) : undefined,
  };
}

function readUrl(search: SearchRecord): UrlTimeState {
  return {
    from: paramToString(search[PARAM_FROM]),
    to: paramToString(search[PARAM_TO]),
    tz: paramToString(search[PARAM_TZ]),
  };
}

function applyUrlWrite(navigate: ReturnType<typeof useNavigate>, write: UrlWrite): void {
  navigate({
    search: ((prev: SearchRecord) => ({
      ...prev,
      [PARAM_FROM]: write.from,
      [PARAM_TO]: write.to,
      [PARAM_TZ]: write.tz ?? undefined,
    })) as never,
    replace: true,
  });
}

export function useTimeRangeURL(): void {
  // Mounted once in the global Header and active on every route, so this is
  // the one legitimately route-agnostic search consumer: it reads via
  // useSearch({ strict: false }) and navigates relative to the current
  // route. Routes that define validateSearch must pass from/to/tz through.
  const search = useSearch({ strict: false }) as SearchRecord;
  const navigate = useNavigate();
  const timeRange = useTimeRange();
  const timezone = useAppStore((s) => s.timezone);
  const setTimeRange = useAppStore((s) => s.setTimeRange);
  const setTimezone = useAppStore((s) => s.setTimezone);

  const searchRef = useRef(search);
  searchRef.current = search;

  const initialized = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only sync
  useEffect(() => {
    const url = readUrl(search);
    const parsed = parseUrlTimeRange(url.from, url.to);
    if (parsed) {
      setTimeRange(parsed);
      if (url.tz && url.tz !== timezone) setTimezone(url.tz);
    } else {
      const write = resolveUrlWrite(timeRange, timezone, url);
      if (write) applyUrlWrite(navigate, write);
    }
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    const write = resolveUrlWrite(timeRange, timezone, readUrl(searchRef.current));
    if (write) applyUrlWrite(navigate, write);
  }, [timeRange, timezone, navigate]);

  useEffect(() => {
    if (!initialized.current) return;
    const url = readUrl(search);
    const next = resolveStoreWrite(useAppStore.getState().timeRange, url);
    if (next) setTimeRange(next);
    if (url.tz && url.tz !== useAppStore.getState().timezone) setTimezone(url.tz);
  }, [search, setTimeRange, setTimezone]);
}
