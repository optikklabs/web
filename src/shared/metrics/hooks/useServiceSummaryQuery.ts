import {
  type Comparable,
  type ServiceSummaryResponse,
  getServiceSummary,
} from "@shared/api/red/redApi";
import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

/**
 * Canonical per-service RED summary, sourced from `GET /spans/red/summary`.
 * Both the service-detail page and the service drawer consume this single
 * hook so they share one query key (warm cache across views) and one
 * error-rate definition — the backend's — instead of drifting.
 */
export type ServiceSummary = ServiceSummaryResponse;

export function useServiceSummaryQuery(serviceName: string) {
  const query = useTimeRangeQuery<Comparable<ServiceSummaryResponse>>(
    `service-summary:${serviceName}`,
    (start, end) => getServiceSummary(start, end, serviceName),
    { enabled: Boolean(serviceName) }
  );
  return { ...query, summary: query.data?.data ?? null };
}
