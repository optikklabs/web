import { API_CONFIG } from "@config/apiConfig";
import api from "@shared/api/http/client";
import { validateResponse } from "@shared/api/utils/validate";
import { z } from "zod";

const BASE = API_CONFIG.ENDPOINTS.V1_BASE;

const scoreMap = z.record(z.string(), z.number());

const datasetSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  itemCount: z.number(),
  runCount: z.number(),
  updatedAt: z.string(),
});
export type LlmDatasetSummary = z.infer<typeof datasetSummarySchema>;
const listSchema = z.object({ items: z.array(datasetSummarySchema) });
const addItemsSchema = z.object({ added: z.number() });

const itemSchema = z.object({
  id: z.number(),
  input: z.unknown(),
  expectedOutput: z.unknown().optional(),
  metadata: z.unknown().optional(),
  createdAt: z.string(),
});

const runSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  provider: z.string(),
  model: z.string(),
  status: z.string(),
  itemCount: z.number(),
  avgScores: scoreMap,
  totalCostUsd: z.number(),
  avgLatencyMs: z.number(),
  error: z.string().optional(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
});

const datasetDetailSchema = datasetSummarySchema.extend({
  items: z.array(itemSchema),
  runs: z.array(runSummarySchema),
});
export type LlmDatasetDetail = z.infer<typeof datasetDetailSchema>;

const runItemSchema = z.object({
  datasetItemId: z.number(),
  output: z.unknown().optional(),
  latencyMs: z.number(),
  costUsd: z.number(),
  scores: scoreMap,
  error: z.string().optional(),
});

const runDetailSchema = runSummarySchema.extend({
  items: z.array(runItemSchema),
});
export type LlmRunDetail = z.infer<typeof runDetailSchema>;

export interface DatasetItemInput {
  input: unknown;
  expectedOutput?: unknown;
  metadata?: unknown;
}

export interface RunExperimentRequest {
  name?: string;
  provider: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function listDatasets(): Promise<LlmDatasetSummary[]> {
  const res = await api.get<unknown>(`${BASE}/llm/datasets`);
  return validateResponse(listSchema, res).items;
}

export async function getDataset(id: number): Promise<LlmDatasetDetail> {
  const res = await api.get<unknown>(`${BASE}/llm/datasets/${id}`);
  return validateResponse(datasetDetailSchema, res);
}

export async function createDataset(name: string, description?: string): Promise<LlmDatasetDetail> {
  const res = await api.post<unknown>(`${BASE}/llm/datasets`, { name, description });
  return validateResponse(datasetDetailSchema, res);
}

export async function deleteDataset(id: number): Promise<void> {
  await api.delete<unknown>(`${BASE}/llm/datasets/${id}`);
}

export async function addDatasetItems(id: number, items: DatasetItemInput[]): Promise<number> {
  const res = await api.post<unknown>(`${BASE}/llm/datasets/${id}/items`, { items });
  return validateResponse(addItemsSchema, res).added;
}

export async function runExperiment(id: number, req: RunExperimentRequest): Promise<LlmRunDetail> {
  const res = await api.post<unknown>(`${BASE}/llm/datasets/${id}/runs`, req);
  return validateResponse(runDetailSchema, res);
}
