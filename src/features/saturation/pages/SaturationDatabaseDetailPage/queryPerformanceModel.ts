import type { ObservabilityChartSeries } from "@shared/components/ui/charts/ObservabilityChart";
import { getChartColor } from "@shared/utils/chartTheme";

import type {
  QueryPerformanceCatalogue,
  QueryPerformanceResponse,
  QueryPerformanceSeries,
} from "@/features/saturation/api/databaseQueryPerformanceApi";

/**
 * The collection and query the URL asks for when the catalogue still has
 * them, otherwise the catalogue's first entry of each.
 */
export function resolveCatalogueSelection(
  catalogue: QueryPerformanceCatalogue | undefined,
  requested: { readonly collection?: string; readonly queryHash?: string }
): { collection: string | undefined; queryHash: string | undefined } {
  const collections = catalogue?.collections ?? [];
  const queries = catalogue?.queries ?? [];
  return {
    collection: collections.some((item) => item.name === requested.collection)
      ? requested.collection
      : collections[0]?.name,
    queryHash: queries.some((item) => item.queryHash === requested.queryHash)
      ? requested.queryHash
      : queries[0]?.queryHash,
  };
}

/**
 * Series hashes chosen in the URL's comma-separated `queries` param, keeping
 * only well-formed hashes that are present; every hash when unset.
 */
export function selectedQueryHashes(
  raw: string | undefined,
  available: ReadonlySet<string>
): Set<string> {
  if (!raw) return new Set(available);
  return new Set(
    raw.split(",").filter((hash) => /^[0-9a-f]{16}$/.test(hash) && available.has(hash))
  );
}

export function queryDisplayLabel(query: { queryHash: string; queryLabel: string }): string {
  const label = query.queryLabel.trim() || "Database query";
  return `${label} · ${query.queryHash.slice(0, 8)}`;
}

function colorForQuery(queryHash: string): string {
  return getChartColor(Number.parseInt(queryHash.slice(-8), 16));
}

function visibleSeries(
  response: QueryPerformanceResponse,
  visibleHashes: ReadonlySet<string>
): QueryPerformanceSeries[] {
  if (visibleHashes.size === 0) return response.series;
  return response.series.filter((series) => visibleHashes.has(series.queryHash));
}

function timestampsFor(series: QueryPerformanceSeries[]): number[] {
  const timestamps = new Set<number>();
  for (const query of series) {
    for (const point of query.points) timestamps.add(Math.floor(point.timeBucketMs / 1000));
  }
  return Array.from(timestamps).sort((a, b) => a - b);
}

function valuesAt(
  query: QueryPerformanceSeries,
  timestamps: number[],
  value: (point: QueryPerformanceSeries["points"][number]) => number | null
): Array<number | null> {
  const byTimestamp = new Map(
    query.points.map((point) => [Math.floor(point.timeBucketMs / 1000), value(point)])
  );
  return timestamps.map((timestamp) => byTimestamp.get(timestamp) ?? null);
}

export interface QueryPerformanceChartModel {
  readonly timestamps: number[];
  readonly latency: ObservabilityChartSeries[];
  readonly throughput: ObservabilityChartSeries[];
}

export function buildQueryPerformanceCharts(
  response: QueryPerformanceResponse,
  mode: "collection" | "query",
  visibleHashes: ReadonlySet<string>
): QueryPerformanceChartModel {
  const queries = visibleSeries(response, visibleHashes);
  const timestamps = timestampsFor(queries);
  const throughput = queries.map((query) => ({
    label: queryDisplayLabel(query),
    values: valuesAt(query, timestamps, (point) => point.opsPerSec),
    color: colorForQuery(query.queryHash),
  }));
  if (mode === "query") {
    const query = queries[0];
    return {
      timestamps,
      throughput,
      latency: query
        ? [
            {
              label: "p50",
              values: valuesAt(query, timestamps, (point) => point.p50Ms),
              color: "var(--color-info,#3b82f6)",
            },
            {
              label: "p95",
              values: valuesAt(query, timestamps, (point) => point.p95Ms),
              color: "var(--color-warning,#f59e0b)",
            },
            {
              label: "p99",
              values: valuesAt(query, timestamps, (point) => point.p99Ms),
              color: "var(--color-error,#ef4444)",
            },
          ]
        : [],
    };
  }
  const sampledPercentile = (point: QueryPerformanceSeries["points"][number], value: number) =>
    point.opsPerSec * response.bucketSizeSeconds >= 20 ? value : null;
  return {
    timestamps,
    throughput,
    latency: queries
      .flatMap((query) => {
        const color = colorForQuery(query.queryHash);
        const label = queryDisplayLabel(query);
        return [
          {
            label: `${label} p95`,
            values: valuesAt(query, timestamps, (point) => sampledPercentile(point, point.p95Ms)),
            color,
            dash: [6, 4],
          },
          {
            label: `${label} p99`,
            values: valuesAt(query, timestamps, (point) => sampledPercentile(point, point.p99Ms)),
            color,
          },
        ];
      })
      .filter((series) => series.values.some((value) => value != null)),
  };
}
