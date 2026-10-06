import { type TimeRangeSearch, pickTimeRangeSearch } from "@shared/hooks/useTimeRangeURL";
import {
  CHART_TYPES,
  type ChartType,
  METRIC_SPACE_AGGREGATIONS,
  type MetricSpaceAggregation,
  TIME_STEPS,
  type TimeStep,
} from "@shared/metrics/types";
import { asSearchEnum, asSearchString } from "@shared/search/utils/urlState";

/**
 * Explorer state that must survive a page share/reload. `queries` and
 * `formulas` are base64 state snapshots; the rest are enums, and values
 * outside them are dropped so the explorer falls back to its defaults.
 */
export type MetricsExplorerSearch = TimeRangeSearch & {
  queries?: string;
  formulas?: string;
  chartType?: ChartType;
  step?: TimeStep;
  spaceAgg?: MetricSpaceAggregation;
};

export function validateMetricsExplorerSearch(
  search: Record<string, unknown>
): MetricsExplorerSearch {
  return {
    ...pickTimeRangeSearch(search),
    queries: asSearchString(search.queries),
    formulas: asSearchString(search.formulas),
    chartType: asSearchEnum(search.chartType, CHART_TYPES),
    step: asSearchEnum(search.step, TIME_STEPS),
    spaceAgg: asSearchEnum(search.spaceAgg, METRIC_SPACE_AGGREGATIONS),
  };
}
