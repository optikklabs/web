const ONE_THOUSAND = 1000;
const ONE_MINUTE_MS = 60_000;
const ONE_DAY_HOURS = 24;
const THIRTY_DAYS = 30;
const MICROSECONDS_MULTIPLIER = 1000;

const compactFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatNumber(num: number | string | null | undefined): string {
  const value = Number(num);
  if (!Number.isFinite(value)) return "0";
  return compactFormatter.format(value);
}

export function formatDuration(ms: number | string | null | undefined): string {
  let value = Number(ms);
  value = value === 0 ? 0 : value;
  if (!Number.isFinite(value)) return "0ms";
  if (value === 0) return "0ms";
  if (value < 1) {
    return `${(value * MICROSECONDS_MULTIPLIER).toFixed(0)}μs`;
  }
  if (value < ONE_THOUSAND) {
    return `${value.toFixed(0)}ms`;
  }
  if (value < ONE_MINUTE_MS) {
    return `${(value / ONE_THOUSAND).toFixed(2)}s`;
  }
  return `${(value / ONE_MINUTE_MS).toFixed(2)}m`;
}

export function formatTimestamp(timestamp: number | string | Date, tz = "local"): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";

  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    fractionalSecondDigits: 3,
  };
  if (tz !== "local") opts.timeZone = tz;

  try {
    return new Intl.DateTimeFormat("sv-SE", opts).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / k ** i;

  const formattedVal =
    i === 0 ? Math.round(val).toString() : Number.parseFloat(val.toFixed(2)).toString();
  return `${formattedVal}${sizes[i] ?? "B"}`;
}

export function formatPercentage(
  value: number | string | null | undefined,
  decimals = 2,
  clamp = true
): string {
  if (value == null) return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";

  const percent = clamp ? Math.min(Math.max(num, 0), 100) : num;
  if (Math.abs(percent) < 1e-9) return "0%";

  const formatted = percent.toFixed(decimals);
  const clean = Number.parseFloat(formatted).toString();
  return `${clean}%`;
}

export function formatRelativeTime(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";
  const now = Date.now();
  const diff = now - date.getTime();

  const seconds = Math.floor(diff / ONE_THOUSAND);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < ONE_DAY_HOURS) return `${hours}h ago`;

  const days = Math.floor(hours / ONE_DAY_HOURS);
  if (days < THIRTY_DAYS) return `${days}d ago`;

  return formatTimestamp(timestamp);
}

// Null-tolerant metric formatters. Unlike the format* functions above, these
// render "—" or "N/A" for missing/non-finite values instead of a zero value,
// which is the right default for metric KPIs where "no data" differs from "zero".

export function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return formatNumber(n);
}

export function fmtMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  return formatDuration(ms);
}

export function fmtPct(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return formatPercentage(value, digits, false);
}

export function ratioFromCounts(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return (numerator * 100) / denominator;
}
