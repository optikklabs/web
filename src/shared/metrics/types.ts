// Metrics Explorer Types

type MetricType = "gauge" | "counter" | "histogram" | "exponential_histogram" | "summary";

export interface MetricNameEntry {
  readonly name: string;
  readonly type: MetricType;
  readonly unit?: string;
  readonly description?: string;
  readonly temporality: string;
  readonly isMonotonic: boolean;
}

export type MetricAggregation =
  | "avg"
  | "sum"
  | "min"
  | "max"
  | "count"
  | "p50"
  | "p95"
  | "p99"
  | "rate";

export type MetricFilterOperator = "eq" | "neq" | "in" | "not_in" | "wildcard";

export interface MetricTagFilter {
  readonly key: string;
  readonly operator: MetricFilterOperator;
  readonly value: string | string[];
}

export const METRIC_SPACE_AGGREGATIONS = ["avg", "sum", "min", "max"] as const;
export type MetricSpaceAggregation = (typeof METRIC_SPACE_AGGREGATIONS)[number];

export interface MetricQueryDefinition {
  readonly id: string;
  readonly aggregation: MetricAggregation;
  readonly metricName: string;
  readonly where: MetricTagFilter[];
  readonly groupBy: string[];
  readonly spaceAggregation: MetricSpaceAggregation;
}

export const CHART_TYPES = ["line", "area", "bar", "stack", "heat", "top"] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export type MetricYAxisScale = "linear" | "log" | "percent";

export type TopSeriesGroupBy = "host" | "region" | "version";

export const TIME_STEPS = ["1m", "5m", "15m", "1h", "1d"] as const;
export type TimeStep = (typeof TIME_STEPS)[number];

export interface MetricSeriesData {
  readonly tags: Record<string, string>;
  readonly values: Array<number | null>;
}

export interface MetricQueryResult {
  readonly timestamps: number[];
  readonly series: MetricSeriesData[];
}

export type MetricExplorerResults = Record<string, MetricQueryResult>;

export interface FormulaDefinition {
  readonly id: string;
  readonly expression: string;
}
