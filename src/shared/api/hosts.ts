import { z } from "zod";

import api from "@/shared/api/http/client";
import type { RequestTime } from "@/shared/api/service-types";
import { validateResponse } from "@/shared/api/utils/validate";
import { API_CONFIG } from "@config/apiConfig";

const V1 = API_CONFIG.ENDPOINTS.V1_BASE;

/**
 * Mirrors models.Host from GET /infrastructure/hosts. cpu/mem/disk are
 * utilization percentages, null when the host did not report them;
 * saturation is the highest reported. The RED traffic fields are present only
 * when the request is scoped to a service.
 */
const hostSchema = z.object({
  host: z.string(),
  subsystem: z.string(),
  cpu: z.number().nullable(),
  mem: z.number().nullable(),
  disk: z.number().nullable(),
  saturation: z.number().nullable(),
  tone: z.string(),
  zone: z.string().optional(),
  rps: z.number().optional(),
  errorRate: z.number().optional(),
  p99Ms: z.number().optional(),
  status: z.enum(["healthy", "warn", "error"]).optional(),
  lastSeen: z.string().optional(),
  requestCount: z.number().optional(),
  errorCount: z.number().optional(),
});
export type Host = z.infer<typeof hostSchema>;

export async function getHosts(
  s: RequestTime,
  e: RequestTime,
  serviceName?: string
): Promise<Host[]> {
  const res = await api.get<unknown>(`${V1}/infrastructure/hosts`, {
    params: { startTime: s, endTime: e, service: serviceName },
  });
  return validateResponse(z.array(hostSchema), res);
}
