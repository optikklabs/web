import { type EndpointRateSeries, getREDByEndpoint } from "@shared/api/red/redApi";
import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

/**
 * Per-endpoint RED series for a service. Request rate and error rate cards
 * both subscribe to this one key, so the two panels share a single request
 * instead of fanning out one apiece.
 */
export function useEndpointRED(serviceName: string) {
  return useTimeRangeQuery<EndpointRateSeries>(
    `service-detail.red-by-endpoint:${serviceName}`,
    (start, end) => getREDByEndpoint(start, end, serviceName),
    { enabled: Boolean(serviceName) }
  );
}
