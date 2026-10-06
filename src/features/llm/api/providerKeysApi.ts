import { API_CONFIG } from "@config/apiConfig";
import api from "@shared/api/http/client";
import { validateResponse } from "@shared/api/utils/validate";
import { z } from "zod";

const BASE = API_CONFIG.ENDPOINTS.V1_BASE;

const providerKeySchema = z.object({
  id: z.number(),
  provider: z.string(),
  label: z.string(),
  last4: z.string(),
  createdAt: z.string(),
});
export type LlmProviderKey = z.infer<typeof providerKeySchema>;
const listSchema = z.object({ items: z.array(providerKeySchema) });

export interface CreateProviderKeyRequest {
  provider: "openai" | "anthropic" | "mistral";
  label: string;
  apiKey: string;
}

export async function listProviderKeys(): Promise<LlmProviderKey[]> {
  const res = await api.get<unknown>(`${BASE}/llm/provider-keys`);
  return validateResponse(listSchema, res).items;
}

export async function createProviderKey(req: CreateProviderKeyRequest): Promise<LlmProviderKey> {
  const res = await api.post<unknown>(`${BASE}/llm/provider-keys`, req);
  return validateResponse(providerKeySchema, res);
}

export async function deleteProviderKey(id: number): Promise<void> {
  await api.delete<unknown>(`${BASE}/llm/provider-keys/${id}`);
}
