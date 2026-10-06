import { API_CONFIG } from "@config/apiConfig";
import api from "@shared/api/http/client";
import { validateResponse } from "@shared/api/utils/validate";
import { z } from "zod";

const BASE = API_CONFIG.ENDPOINTS.V1_BASE;

interface RangeParams {
  startTime: number;
  endTime: number;
}

const summarySchema = z.object({
  name: z.string(),
  dataType: z.string(),
  count: z.number(),
  mean: z.number(),
});
export type LlmScoreSummary = z.infer<typeof summarySchema>;
const summaryResponseSchema = z.object({ summaries: z.array(summarySchema) });

export async function getScoreSummary(range: RangeParams): Promise<LlmScoreSummary[]> {
  const res = await api.get<unknown>(`${BASE}/llm/scores/summary`, { params: range });
  const data = validateResponse(summaryResponseSchema, res);
  return data.summaries;
}
