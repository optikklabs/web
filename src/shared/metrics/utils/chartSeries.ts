import type { ObservabilityChartSeries } from "@shared/components/ui/charts/ObservabilityChart";

import { QUERY_LABEL_COLORS } from "@shared/metrics/constants";
import type {
  ChartType,
  FormulaDefinition,
  MetricExplorerResults,
  MetricQueryDefinition,
} from "@shared/metrics/types";
import { getChartColor } from "@shared/utils/chartTheme";
import { evaluateFormula } from "./formulaEvaluator";

const FORMULA_COLOR = "#f59e0b";

/** Underlying renderable type for the uPlot-backed chart. "stack" renders as a
 * filled area; "heat"/"top" are handled by sibling panels, never this chart. */
export function toRenderType(chartType: ChartType): "line" | "area" | "bar" {
  if (chartType === "bar") return "bar";
  if (chartType === "area" || chartType === "stack") return "area";
  return "line";
}

function buildTimestampAxis(
  queries: readonly MetricQueryDefinition[],
  results: MetricExplorerResults
): { timestamps: number[]; indexByTimestamp: ReadonlyMap<number, number> } {
  const timestamps = [
    ...new Set(queries.flatMap((query) => results[query.id]?.timestamps ?? [])),
  ].sort((a, b) => a - b);
  return {
    timestamps,
    indexByTimestamp: new Map(timestamps.map((timestamp, index) => [timestamp, index])),
  };
}

function alignValues(
  sourceTimestamps: readonly number[],
  sourceValues: readonly (number | null)[],
  axisLength: number,
  indexByTimestamp: ReadonlyMap<number, number>
): Array<number | null> {
  const values = Array<number | null>(axisLength).fill(null);
  sourceTimestamps.forEach((timestamp, index) => {
    const target = indexByTimestamp.get(timestamp);
    if (target !== undefined) values[target] = sourceValues[index] ?? null;
  });
  return values;
}

function queryChartSeries(
  queries: readonly MetricQueryDefinition[],
  results: MetricExplorerResults,
  timestamps: readonly number[],
  indexByTimestamp: ReadonlyMap<number, number>,
  chartType: ChartType
): ObservabilityChartSeries[] {
  const output: ObservabilityChartSeries[] = [];
  for (const query of queries) {
    const result = results[query.id];
    if (!result) continue;
    const baseColor = QUERY_LABEL_COLORS[query.id] ?? getChartColor(output.length);
    for (const series of result.series) {
      const tags = Object.values(series.tags).join(", ");
      const metric = `${query.id}: ${query.aggregation}(${query.metricName})`;
      output.push({
        label: tags ? `${metric} [${tags}]` : metric,
        values: alignValues(result.timestamps, series.values, timestamps.length, indexByTimestamp),
        color: result.series.length > 1 ? getChartColor(output.length) : baseColor,
        fill: toRenderType(chartType) === "area",
      });
    }
  }
  return output;
}

function formulaChartSeries(
  formulas: readonly FormulaDefinition[],
  results: MetricExplorerResults,
  timestamps: number[]
): ObservabilityChartSeries[] {
  return formulas.flatMap((formula) =>
    formula.expression.trim()
      ? [
          {
            label: `${formula.id}: ${formula.expression}`,
            values: evaluateFormula(formula.expression, results, timestamps),
            color: FORMULA_COLOR,
            fill: false,
            dash: [6, 3] as [number, number],
          },
        ]
      : []
  );
}

/** Maps query + formula results into uPlot-ready timestamps + series. Shared by
 * the metrics explorer chart and dashboard widget renderer for WYSIWYG parity. */
export function buildSeries(
  queries: MetricQueryDefinition[],
  formulas: FormulaDefinition[],
  results: MetricExplorerResults,
  chartType: ChartType
): { timestamps: number[]; series: ObservabilityChartSeries[] } {
  const { timestamps, indexByTimestamp } = buildTimestampAxis(queries, results);
  return {
    timestamps,
    series: [
      ...queryChartSeries(queries, results, timestamps, indexByTimestamp, chartType),
      ...formulaChartSeries(formulas, results, timestamps),
    ],
  };
}
