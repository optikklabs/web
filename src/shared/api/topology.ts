import { z } from "zod";

import { API_V1_BASE } from "@config/apiConfig";
import api from "@shared/api/http/client";
import { validateResponse } from "@shared/api/utils/validate";

/**
 * Mirrors services/topology models. No field is `omitempty`, and `nodes`/
 * `edges` are built with `make(..., 0, n)` so they are never null.
 */
const serviceNodeSchema = z.object({
  name: z.string(),
  requestCount: z.number(),
  errorCount: z.number(),
  errorRate: z.number(),
  p50LatencyMs: z.number(),
  p95LatencyMs: z.number(),
  p99LatencyMs: z.number(),
  // classifyHealth only ever returns these three constants.
  health: z.enum(["healthy", "degraded", "unhealthy"]),
});

const serviceEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  callCount: z.number(),
  errorCount: z.number(),
  errorRate: z.number(),
  p50LatencyMs: z.number(),
  p95LatencyMs: z.number(),
});

export const topologyResponseSchema = z.object({
  nodes: z.array(serviceNodeSchema),
  edges: z.array(serviceEdgeSchema),
});

export type ServiceTopologyNode = z.infer<typeof serviceNodeSchema>;
export type ServiceTopologyEdge = z.infer<typeof serviceEdgeSchema>;
export type ServiceTopologyResponse = z.infer<typeof topologyResponseSchema>;

interface FetchParams {
  startTime: number | string;
  endTime: number | string;
  service?: string;
}

/** Service graph over the window; `service` scopes it to that service's neighbours. */
export async function getServiceTopology(params: FetchParams): Promise<ServiceTopologyResponse> {
  return validateResponse(
    topologyResponseSchema,
    await api.get<unknown>(`${API_V1_BASE}/services/topology`, { params })
  );
}
