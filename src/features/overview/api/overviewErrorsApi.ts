import { API_CONFIG } from "@config/apiConfig";
import { api } from "@shared/api/http/client";
import type { RequestTime } from "@shared/api/service-types";
import { validateResponse } from "@shared/api/utils/validate";
import { z } from "zod";

const errorHotspotSchema = z.array(
  z.object({
    serviceName: z.string(),
    operationName: z.string(),
    groupId: z.string(),
    errorCount: z.number(),
  })
);

export type ErrorHotspotCell = z.infer<typeof errorHotspotSchema>[number];

/** Error counts per service, operation and error group over the window. */
export async function getErrorHotspot(
  startTime: RequestTime,
  endTime: RequestTime,
  signal?: AbortSignal
): Promise<ErrorHotspotCell[]> {
  return validateResponse(
    errorHotspotSchema,
    await api.get<unknown>(`${API_CONFIG.ENDPOINTS.V1_BASE}/spans/error-hotspot`, {
      params: { startTime, endTime },
      signal,
    })
  );
}
