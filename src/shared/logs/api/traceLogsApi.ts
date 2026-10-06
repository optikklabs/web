import { API_CONFIG } from "@config/apiConfig";
import api from "@shared/api/http/client";
import { traceLogSchema } from "@shared/api/traces/schemas";
import type { TraceLogsResponse } from "@shared/api/traces/schemas";
import { validateResponse } from "@shared/api/utils/validate";
import { z } from "zod";

const BASE = API_CONFIG.ENDPOINTS.V1_BASE;

export async function getTraceLogs(
  traceId: string,
  startMs?: number,
  endMs?: number,
  limit?: number,
  signal?: AbortSignal
): Promise<TraceLogsResponse> {
  const data = await api.get(`${BASE}/logs/trace/${traceId}`, {
    params: { limit, startTime: startMs, endTime: endMs },
    signal,
  });
  const logs = validateResponse(z.array(traceLogSchema), data);
  return { logs, isSpeculative: false };
}
