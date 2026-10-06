import { z } from "zod";

import api from "@/shared/api/http/client";
import type { RequestTime } from "@/shared/api/service-types";
import { validateResponse } from "@/shared/api/utils/validate";
import { API_CONFIG } from "@config/apiConfig";

const V1 = API_CONFIG.ENDPOINTS.V1_BASE;

/** Mirrors models.PodOverview; requestCount 0 means no traffic. */
const podOverviewSchema = z.object({
  pod: z.string(),
  host: z.string().optional(),
  lastSeen: z.string().nullable(),
  containers: z.array(z.string()),
  services: z.array(z.string()),
  environments: z.array(z.string()),
  namespaces: z.array(z.string()),
  requestCount: z.number(),
  errorCount: z.number(),
  // Null when the pod served no requests.
  errorRate: z.number().nullable(),
  avgLatencyMs: z.number().nullable(),
  p95LatencyMs: z.number().nullable(),
  availableMetrics: z.array(z.string()),
});
export type PodOverview = z.infer<typeof podOverviewSchema>;

export type PodMetricGroup =
  | "cpu"
  | "memory"
  | "network_io"
  | "network_errors"
  | "filesystem"
  | "restarts"
  | "jvm_memory";

export async function getPodOverview(
  pod: string,
  startTime: RequestTime,
  endTime: RequestTime
): Promise<PodOverview> {
  const res = await api.get<unknown>(
    `${V1}/infrastructure/pods/${encodeURIComponent(pod)}/overview`,
    { params: { startTime, endTime } }
  );
  return validateResponse(podOverviewSchema, res);
}

/** Series endpoint for SeriesChartCard; pass `metric` via extraParams. */
export function podSeriesEndpoint(pod: string): string {
  return `${V1}/infrastructure/pods/${encodeURIComponent(pod)}/series`;
}
