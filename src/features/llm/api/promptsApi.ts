import { API_CONFIG } from "@config/apiConfig";
import api from "@shared/api/http/client";
import { validateResponse } from "@shared/api/utils/validate";
import { z } from "zod";

const BASE = API_CONFIG.ENDPOINTS.V1_BASE;

const promptSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()),
  versionCount: z.number(),
  productionVersion: z.number().optional(),
  updatedAt: z.string(),
});
export type LlmPromptSummary = z.infer<typeof promptSummarySchema>;
const listSchema = z.object({ items: z.array(promptSummarySchema) });

const versionSchema = z.object({
  version: z.number(),
  template: z.unknown(),
  variables: z.array(z.string()),
  notes: z.string().optional(),
  status: z.string(),
  createdAt: z.string(),
});

const detailSchema = promptSummarySchema.extend({
  versions: z.array(versionSchema),
});
export type LlmPromptDetail = z.infer<typeof detailSchema>;

export interface CreatePromptRequest {
  name: string;
  type?: "chat" | "text";
  description?: string;
  tags?: string[];
  template: unknown;
  variables?: string[];
  notes?: string;
}

export interface CreateVersionRequest {
  template: unknown;
  variables?: string[];
  notes?: string;
  production?: boolean;
}

export async function listPrompts(): Promise<LlmPromptSummary[]> {
  const res = await api.get<unknown>(`${BASE}/llm/prompts`);
  return validateResponse(listSchema, res).items;
}

export async function getPrompt(name: string): Promise<LlmPromptDetail> {
  const res = await api.get<unknown>(`${BASE}/llm/prompts/${encodeURIComponent(name)}`);
  return validateResponse(detailSchema, res);
}

export async function createPrompt(req: CreatePromptRequest): Promise<LlmPromptDetail> {
  const res = await api.post<unknown>(`${BASE}/llm/prompts`, req);
  return validateResponse(detailSchema, res);
}

export async function createPromptVersion(
  name: string,
  req: CreateVersionRequest
): Promise<LlmPromptDetail> {
  const res = await api.post<unknown>(
    `${BASE}/llm/prompts/${encodeURIComponent(name)}/versions`,
    req
  );
  return validateResponse(detailSchema, res);
}

export async function setPromptVersionStatus(
  name: string,
  version: number,
  status: "draft" | "production" | "archived"
): Promise<LlmPromptDetail> {
  const res = await api.patch<unknown>(
    `${BASE}/llm/prompts/${encodeURIComponent(name)}/versions/${version}`,
    { status }
  );
  return validateResponse(detailSchema, res);
}
