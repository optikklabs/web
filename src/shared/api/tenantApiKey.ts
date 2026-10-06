import api from "@/shared/api/http/client";
import { validateResponse } from "@/shared/api/utils/validate";
import { API_CONFIG } from "@config/apiConfig";
import { z } from "zod";

const rotateApiKeySchema = z.object({
  id: z.number(),
  name: z.string(),
  active: z.boolean(),
  /** The new key in plaintext — shown once, never retrievable again. */
  apiKey: z.string(),
  apiKeyPrefix: z.string(),
  createdAt: z.string(),
});

export type RotateApiKeyResponse = z.infer<typeof rotateApiKeySchema>;

/** Rotates the tenant ingest API key (admin only). */
export async function rotateApiKey(): Promise<RotateApiKeyResponse> {
  return validateResponse(
    rotateApiKeySchema,
    await api.post<unknown>(`${API_CONFIG.ENDPOINTS.V1_BASE}/settings/api-key/rotate`)
  );
}
