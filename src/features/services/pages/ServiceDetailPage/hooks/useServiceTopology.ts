import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import { type ServiceTopologyResponse, getServiceTopology } from "@shared/api/topology";

// Fetches the runtime topology scoped to a focus service. The server owns all
// neighborhood pruning (1-hop upstream + downstream) — the focus name is sent
// as a query param and is part of the cache key so changing focus refetches.
export function useServiceTopology(serviceName: string) {
  return useTimeRangeQuery<ServiceTopologyResponse>(
    "service-detail.topology",
    (startTime, endTime) => getServiceTopology({ startTime, endTime, service: serviceName }),
    { enabled: Boolean(serviceName), extraKeys: [serviceName] }
  );
}
