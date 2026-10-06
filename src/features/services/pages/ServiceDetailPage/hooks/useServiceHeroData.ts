import { type ServiceHealth, classifyServiceHealth } from "@/features/services/utils/serviceHealth";
import {
  type ServiceSummary,
  useServiceSummaryQuery,
} from "@shared/metrics/hooks/useServiceSummaryQuery";

export interface HeroData {
  readonly summary: ServiceSummary | null;
  readonly status: ServiceHealth;
  readonly loading: boolean;
}

function statusForSummary(summary: ServiceSummary | null): ServiceHealth {
  if (!summary) return "unknown";
  return classifyServiceHealth(summary.errorRate, summary.p99Ms);
}

export function useServiceHeroData(serviceName: string): HeroData {
  const summaryQ = useServiceSummaryQuery(serviceName);
  return {
    summary: summaryQ.summary,
    status: statusForSummary(summaryQ.summary),
    loading: summaryQ.isPending,
  };
}
