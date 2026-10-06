import type { z } from "zod";

import api from "@/shared/api/http/client";
import type { RequestTime } from "@/shared/api/service-types";
import { validateResponse } from "@/shared/api/utils/validate";
import { API_CONFIG } from "@config/apiConfig";

const BASE = API_CONFIG.ENDPOINTS.V1_BASE;

export function rangeParams(
  startTime: RequestTime,
  endTime: RequestTime
): Record<string, RequestTime> {
  return { startTime, endTime };
}

export async function getSaturation<T>(
  path: string,
  schema: z.ZodType<T>,
  params: Record<string, RequestTime | string | number | undefined>
): Promise<T> {
  const data = await api.get(`${BASE}${path}`, { params });
  return validateResponse(schema, data);
}
