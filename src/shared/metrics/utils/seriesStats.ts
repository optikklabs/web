import type {
  MetricQueryResult,
  MetricSeriesData,
  MetricSpaceAggregation,
} from "@shared/metrics/types";

/**
 * Per-series summary statistics computed over a single series' value array.
 * Every statistic is null when the series has no samples.
 */
export interface SeriesStats {
  readonly min: number | null;
  readonly avg: number | null;
  readonly max: number | null;
  readonly p95: number | null;
  readonly p99: number | null;
  readonly first: number | null;
  readonly last: number | null;
  readonly samples: number;
  readonly delta: number | null;
}

export interface QuerySummary {
  readonly current: number | null;
  readonly avg: number | null;
  readonly min: number | null;
  readonly max: number | null;
  readonly samples: number;
  readonly cardinality: number;
  readonly delta: number | null;
}

/** The finite values of `values`, in order. */
function samplesOf(values: ReadonlyArray<number | null | undefined>): number[] {
  return values.filter((v): v is number => v != null && !Number.isNaN(v));
}

/** Linear-interpolated percentile of an ascending list; null when empty. */
function percentile(sorted: readonly number[], p: number): number | null {
  const rank = (p / 100) * (sorted.length - 1);
  const low = sorted[Math.floor(rank)];
  const high = sorted[Math.ceil(rank)];
  if (low === undefined || high === undefined) return null;
  return low + (high - low) * (rank - Math.floor(rank));
}

function mean(samples: readonly number[]): number | null {
  return samples.length > 0 ? samples.reduce((acc, v) => acc + v, 0) / samples.length : null;
}

/** First-to-last change across samples; null without at least one sample. */
function change(samples: readonly number[]): number | null {
  const first = samples[0];
  const last = samples.at(-1);
  return first !== undefined && last !== undefined ? last - first : null;
}

export function computeSeriesStats(series: MetricSeriesData): SeriesStats {
  const samples = samplesOf(series.values);
  const sorted = samples.toSorted((a, b) => a - b);
  return {
    min: sorted[0] ?? null,
    avg: mean(samples),
    max: sorted.at(-1) ?? null,
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    first: samples[0] ?? null,
    last: samples.at(-1) ?? null,
    samples: samples.length,
    delta: change(samples),
  };
}

function aggregateAcross(values: number[], spaceAgg: MetricSpaceAggregation): number | null {
  if (values.length === 0) return null;
  switch (spaceAgg) {
    case "sum":
      return values.reduce((acc, v) => acc + v, 0);
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    case "avg":
      return values.reduce((acc, v) => acc + v, 0) / values.length;
  }
}

function aggregatedTimeline(
  result: MetricQueryResult,
  spaceAgg: MetricSpaceAggregation
): Array<number | null> {
  const length = result.timestamps.length;
  const timeline: Array<number | null> = [];
  for (let i = 0; i < length; i++) {
    timeline.push(
      aggregateAcross(samplesOf(result.series.map((series) => series.values[i])), spaceAgg)
    );
  }
  return timeline;
}

export function computeQuerySummary(
  result: MetricQueryResult | undefined,
  spaceAgg: MetricSpaceAggregation
): QuerySummary {
  const samples = result ? samplesOf(aggregatedTimeline(result, spaceAgg)) : [];
  const sorted = samples.toSorted((a, b) => a - b);
  return {
    current: samples.at(-1) ?? null,
    avg: mean(samples),
    min: sorted[0] ?? null,
    max: sorted.at(-1) ?? null,
    samples: result?.series.reduce((acc, s) => acc + samplesOf(s.values).length, 0) ?? 0,
    cardinality: result?.series.length ?? 0,
    delta: change(samples),
  };
}
