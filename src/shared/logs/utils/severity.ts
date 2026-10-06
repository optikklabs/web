/**
 * Severity bucket ↔ label ↔ color mapping.
 *
 * Buckets mirror the backend's `severityBucket UInt8` column (0..5) per
 * the observability.logs schema (`ingest/db/03_logs.sql`). Keep the tuples
 * ordered so callers can iterate legends deterministically.
 */

type SeverityBucket = 0 | 1 | 2 | 3 | 4 | 5;

export type SeveritySlug = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface SeverityStyle {
  readonly bucket: SeverityBucket;
  readonly label: string;
  readonly shortLabel: string;
  readonly color: string;
  readonly slug: SeveritySlug;
}

const STYLES = [
  { bucket: 0, label: "Trace", shortLabel: "TRC", color: "#7e8ea0", slug: "trace" },
  { bucket: 1, label: "Debug", shortLabel: "DBG", color: "#4e9fdd", slug: "debug" },
  { bucket: 2, label: "Info", shortLabel: "INF", color: "#73bf69", slug: "info" },
  { bucket: 3, label: "Warn", shortLabel: "WRN", color: "#e0b400", slug: "warn" },
  { bucket: 4, label: "Error", shortLabel: "ERR", color: "#e8494d", slug: "error" },
  { bucket: 5, label: "Fatal", shortLabel: "FTL", color: "#c00021", slug: "fatal" },
] as const satisfies readonly SeverityStyle[];

export const SEVERITY_STYLES: readonly SeverityStyle[] = STYLES;

export function severityStyle(bucket: number | undefined | null): SeverityStyle {
  if (bucket == null) return STYLES[2];
  const clamped = Math.max(0, Math.min(5, Math.trunc(bucket))) as SeverityBucket;
  return STYLES[clamped];
}

export function severityColor(bucket: number | undefined | null): string {
  return severityStyle(bucket).color;
}
