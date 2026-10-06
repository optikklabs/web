import { useStandardQuery } from "@/shared/hooks/useStandardQuery";
import { useResolvedTimeBounds } from "@app/store/appStore";
import { metricsExplorerApi } from "@shared/metrics/api/metricsExplorerApi";

export function useMetricTags(metricName: string) {
  const { startTime, endTime } = useResolvedTimeBounds();

  return useStandardQuery({
    queryKey: ["metrics", "tags", metricName, startTime, endTime],
    queryFn: () => metricsExplorerApi.getMetricTags({ metricName, startTime, endTime }),
    enabled: Boolean(metricName),
    staleTime: 60_000,
  });
}

export function useMetricTagValues(metricName: string, tagKey: string) {
  const { startTime, endTime } = useResolvedTimeBounds();

  return useStandardQuery({
    queryKey: ["metrics", "tagValues", metricName, tagKey, startTime, endTime],
    queryFn: () => metricsExplorerApi.getMetricTags({ metricName, tagKey, startTime, endTime }),
    enabled: Boolean(metricName) && Boolean(tagKey),
    staleTime: 60_000,
  });
}
