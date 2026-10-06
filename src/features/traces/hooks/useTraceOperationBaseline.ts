import api from "@/shared/api/http/client";
import type { RequestTime } from "@/shared/api/service-types";
import { validateResponse } from "@/shared/api/utils/validate";
import { API_CONFIG } from "@config/apiConfig";
import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";
import { z } from "zod";

const operationBaselineSchema = z.object({
  serviceName: z.string(),
  operationName: z.string(),
  p50Ms: z.number(),
  p95Ms: z.number(),
  p99Ms: z.number(),
  spanCount: z.number(),
});

type OperationBaseline = z.infer<typeof operationBaselineSchema>;

async function getOperationBaseline(
  startTime: RequestTime,
  endTime: RequestTime,
  service: string,
  operation: string
): Promise<OperationBaseline> {
  return validateResponse(
    operationBaselineSchema,
    await api.get<unknown>(`${API_CONFIG.ENDPOINTS.V1_BASE}/spans/red/operation-baseline`, {
      params: { startTime, endTime, service, operation },
    })
  );
}

/**
 * Windowed p50/p95/p99 for the trace's root service+operation — feeds the
 * Trace Detail Duration card's "N× slower than p50" baseline.
 */
export function useTraceOperationBaseline(
  service: string | undefined,
  operation: string | undefined
) {
  return useTimeRangeQuery<OperationBaseline>(
    "trace-detail.operation-baseline",
    (start, end) => getOperationBaseline(start, end, service ?? "", operation ?? ""),
    { extraKeys: [service ?? "", operation ?? ""], enabled: Boolean(service && operation) }
  );
}
