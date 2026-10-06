import type { MetricQueryResult } from "@shared/metrics/types";
import { computeSeriesStats } from "@shared/metrics/utils/seriesStats";

/** Tag keys present across a query's series, in stable first-seen order. */
export function collectTagKeys(result: MetricQueryResult | undefined): string[] {
  if (!result) return [];
  const keys: string[] = [];
  for (const series of result.series) {
    for (const key of Object.keys(series.tags)) {
      if (!keys.includes(key)) keys.push(key);
    }
  }
  return keys;
}

function escapeCsv(field: string): string {
  if (/[",\n]/.test(field)) return `"${field.replace(/"/g, '""')}"`;
  return field;
}

/** A two-decimal CSV cell; an absent statistic is an empty cell. */
function csvNumber(value: number | null): string {
  return value == null ? "" : value.toFixed(2);
}

/** Serialize the group-by breakdown (one row per series) to CSV text. */
export function buildBreakdownCsv(result: MetricQueryResult | undefined): string {
  if (!result || result.series.length === 0) return "";
  const tagKeys = collectTagKeys(result);
  const header = [...tagKeys, "min", "avg", "p95", "p99", "max", "delta"];
  const lines = [header.map(escapeCsv).join(",")];

  for (const series of result.series) {
    const stats = computeSeriesStats(series);
    const row = [
      ...tagKeys.map((k) => series.tags[k] ?? ""),
      ...[stats.min, stats.avg, stats.p95, stats.p99, stats.max, stats.delta].map(csvNumber),
    ];
    lines.push(row.map(escapeCsv).join(","));
  }

  return lines.join("\n");
}

/** Trigger a client-side download of CSV text as a file. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
