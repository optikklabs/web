import { useStandardQuery } from "@/shared/hooks/useStandardQuery";
import { useResolvedTimeBounds } from "@app/store/appStore";
import { metricsExplorerApi } from "@shared/metrics/api/metricsExplorerApi";

export function useMetricNames(search: string) {
  const { startTime, endTime } = useResolvedTimeBounds();

  return useStandardQuery({
    queryKey: ["metrics", "names", startTime, endTime, search],
    queryFn: () => metricsExplorerApi.getMetricNames({ startTime, endTime, search }),
    staleTime: 60_000,
  });
}
