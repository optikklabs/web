import { useStandardQuery } from "@/shared/hooks/useStandardQuery";
import { useResolvedTimeBounds } from "@app/store/appStore";
import {
  buildExplorerQueryRequest,
  metricsExplorerApi,
} from "@shared/metrics/api/metricsExplorerApi";
import type { MetricQueryDefinition, TimeStep } from "@shared/metrics/types";

export function useMetricsExplorerQuery(queries: MetricQueryDefinition[], step: TimeStep) {
  const { startTime, endTime } = useResolvedTimeBounds();

  const activeQueries = queries.filter((q) => q.metricName);
  const queriesHash = JSON.stringify(activeQueries);

  return useStandardQuery({
    queryKey: ["metrics", "explorer", queriesHash, startTime, endTime, step],
    queryFn: ({ signal }) => {
      return metricsExplorerApi.query(
        buildExplorerQueryRequest(activeQueries, startTime, endTime, step),
        signal
      );
    },
    enabled: activeQueries.length > 0,
  });
}
