import { getServiceErrorRate } from "@shared/api/errors";
import {
  getLatencyPercentilesTimeseries,
  getStatusTimeseries,
  getTopEndpoints,
} from "@shared/api/red/redApi";
import { getServiceTopology } from "@shared/api/topology";
import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";
import { useServiceSummaryQuery } from "@shared/metrics/hooks/useServiceSummaryQuery";

/**
 * Fans the six panel queries that drive the Service Detail drawer. Split
 * out from `useServiceDetailDrawerModel` so the main hook stays under the
 * 200-line file budget.
 */
export function useServiceDrawerQueries(serviceName: string) {
  const enabled = Boolean(serviceName);
  const opts = { extraKeys: [serviceName], enabled };

  const summaryQuery = useServiceSummaryQuery(serviceName);

  const requestTrendQuery = useTimeRangeQuery(
    "service-drawer-request-trend",
    async (s, e) => getStatusTimeseries(s, e, serviceName),
    opts
  );

  const errorTrendQuery = useTimeRangeQuery(
    "service-drawer-error-trend",
    async (s, e) => getServiceErrorRate(s, e, { service: serviceName }),
    opts
  );

  const latencyTrendQuery = useTimeRangeQuery(
    "service-drawer-latency-trend",
    async (s, e) => getLatencyPercentilesTimeseries(s, e, serviceName),
    opts
  );

  const endpointsQuery = useTimeRangeQuery(
    "service-drawer-endpoints",
    async (s, e) => getTopEndpoints(s, e, serviceName, 6),
    opts
  );

  const dependenciesQuery = useTimeRangeQuery(
    "service-drawer-dependencies",
    async (s, e) => getServiceTopology({ startTime: s, endTime: e, service: serviceName }),
    opts
  );

  return {
    summaryQuery,
    requestTrendQuery,
    errorTrendQuery,
    latencyTrendQuery,
    endpointsQuery,
    dependenciesQuery,
  };
}
