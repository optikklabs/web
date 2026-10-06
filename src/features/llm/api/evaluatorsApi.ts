import { API_CONFIG } from "@config/apiConfig";
import api from "@shared/api/http/client";
import { validateResponse } from "@shared/api/utils/validate";
import { z } from "zod";

const BASE = API_CONFIG.ENDPOINTS.V1_BASE;

interface RangeParams {
  startTime: number;
  endTime: number;
}

const evaluatorSchema = z.object({
  id: z.number(),
  name: z.string(),
  scoreName: z.string(),
  judgeModel: z.string().optional(),
  target: z.string(),
  samplingPct: z.number(),
  dataType: z.string(),
  categories: z.array(z.string()),
  promptTemplate: z.string().optional(),
  enabled: z.boolean(),
  analytics: z.object({ count: z.number(), meanValue: z.number() }),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LlmEvaluator = z.infer<typeof evaluatorSchema>;
const listSchema = z.object({ items: z.array(evaluatorSchema) });

export interface EvaluatorUpsertRequest {
  name: string;
  scoreName: string;
  judgeModel?: string;
  target?: "traces" | "generations";
  samplingPct?: number;
  dataType?: "numeric" | "boolean" | "categorical";
  categories?: string[];
  promptTemplate?: string;
  enabled?: boolean;
}

export async function listEvaluators(range: RangeParams): Promise<LlmEvaluator[]> {
  const res = await api.get<unknown>(`${BASE}/llm/evaluators`, { params: range });
  return validateResponse(listSchema, res).items;
}

export async function createEvaluator(req: EvaluatorUpsertRequest): Promise<LlmEvaluator> {
  const res = await api.post<unknown>(`${BASE}/llm/evaluators`, req);
  return validateResponse(evaluatorSchema, res);
}

export async function updateEvaluator(
  id: number,
  req: Partial<EvaluatorUpsertRequest>
): Promise<LlmEvaluator> {
  const res = await api.patch<unknown>(`${BASE}/llm/evaluators/${id}`, req);
  return validateResponse(evaluatorSchema, res);
}

export async function deleteEvaluator(id: number): Promise<void> {
  await api.delete<unknown>(`${BASE}/llm/evaluators/${id}`);
}
