import { API_CONFIG } from "@config/apiConfig";
import api from "@shared/api/http/client";
import { validateResponse } from "@shared/api/utils/validate";
import { pageInfoSchema } from "@shared/search/schemas/pageInfo";
import { z } from "zod";

const BASE = API_CONFIG.ENDPOINTS.V1_BASE;

const traceScoreSchema = z.object({
  name: z.string(),
  dataType: z.string(),
  value: z.number(),
  stringValue: z.string().optional(),
  source: z.string(),
  comment: z.string().optional(),
});
export type LlmTraceScore = z.infer<typeof traceScoreSchema>;

const llmTraceSchema = z.object({
  traceId: z.string(),
  startMs: z.number(),
  durationMs: z.number(),
  service: z.string(),
  operation: z.string(),
  status: z.string(),
  hasError: z.boolean(),
  level: z.string(),
  vendor: z.string(),
  model: z.string(),
  userId: z.string(),
  sessionId: z.string(),
  tags: z.array(z.string()),
  llmCalls: z.number(),
  promptPreview: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cost: z.number(),
  scores: z.array(traceScoreSchema),
});
export type LlmTrace = z.infer<typeof llmTraceSchema>;

const tracesResponseSchema = z.object({
  results: z.array(llmTraceSchema),
  pageInfo: pageInfoSchema,
});
export type LlmTracesResponse = z.infer<typeof tracesResponseSchema>;

const llmSpanSchema = z.object({
  spanId: z.string(),
  parentSpanId: z.string(),
  name: z.string(),
  service: z.string(),
  operation: z.string(),
  kind: z.string(),
  vendor: z.string(),
  model: z.string(),
  responseModel: z.string().optional(),
  startMs: z.number(),
  durationMs: z.number(),
  hasError: z.boolean(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cost: z.number(),
  prompt: z.string().optional(),
  completion: z.string().optional(),
  promptTruncated: z.boolean().optional(),
  completionTruncated: z.boolean().optional(),
});
export type LlmSpan = z.infer<typeof llmSpanSchema>;

const traceDetailSchema = z.object({
  traceId: z.string(),
  name: z.string(),
  service: z.string(),
  environment: z.string(),
  userId: z.string(),
  sessionId: z.string(),
  release: z.string(),
  startMs: z.number(),
  durationMs: z.number(),
  hasError: z.boolean(),
  prompt: z.string(),
  output: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cost: z.number(),
  spans: z.array(llmSpanSchema),
  scores: z.array(traceScoreSchema),
});
export type LlmTraceDetail = z.infer<typeof traceDetailSchema>;

const overviewWindowSchema = z.object({
  llmSpans: z.number(),
  toolSpans: z.number(),
  totalSpans: z.number(),
  traces: z.number(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  errorRate: z.number(),
  p50Ms: z.number(),
  p95Ms: z.number(),
  p99Ms: z.number(),
  cost: z.number(),
});

const overviewSeriesSchema = z.object({
  timestamps: z.array(z.number()),
  llmSpans: z.array(z.number()),
  toolSpans: z.array(z.number()),
  errorRate: z.array(z.number()),
  p95Ms: z.array(z.number()),
  cost: z.array(z.number()),
});

const overviewResponseSchema = z.object({
  current: overviewWindowSchema,
  previous: overviewWindowSchema,
  series: overviewSeriesSchema,
});
export type LlmOverview = z.infer<typeof overviewResponseSchema>;

interface RangeParams {
  startTime: number;
  endTime: number;
}

export async function getLlmOverview(range: RangeParams): Promise<LlmOverview> {
  const res = await api.get<unknown>(`${BASE}/llm/overview`, { params: range });
  return validateResponse(overviewResponseSchema, res);
}

export interface LlmTracesRequest extends RangeParams {
  limit?: number;
  cursor?: string;
  services?: string[];
  vendors?: string[];
  models?: string[];
  status?: string;
  minDurationMs?: number;
}

export async function queryLlmTraces(req: LlmTracesRequest): Promise<LlmTracesResponse> {
  const res = await api.post<unknown>(`${BASE}/llm/traces/query`, req);
  return validateResponse(tracesResponseSchema, res);
}

export async function getLlmTraceDetail(
  traceId: string,
  startTime: number,
  endTime: number
): Promise<LlmTraceDetail> {
  const res = await api.get<unknown>(`${BASE}/llm/traces/${encodeURIComponent(traceId)}`, {
    params: { startTime, endTime },
  });
  return validateResponse(traceDetailSchema, res);
}

const spanIOSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  prompt: z.string(),
  completion: z.string(),
});
export type LlmSpanIO = z.infer<typeof spanIOSchema>;

export async function getLlmSpanIO(
  traceId: string,
  spanId: string,
  startTime: number,
  endTime: number
): Promise<LlmSpanIO> {
  const res = await api.get<unknown>(
    `${BASE}/llm/traces/${encodeURIComponent(traceId)}/spans/${encodeURIComponent(spanId)}/io`,
    { params: { startTime, endTime } }
  );
  return validateResponse(spanIOSchema, res);
}

const modelUsageSchema = z.object({
  model: z.string(),
  vendor: z.string(),
  traces: z.number(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  p50Ms: z.number(),
  p95Ms: z.number(),
  cost: z.number(),
});
export type LlmModelUsage = z.infer<typeof modelUsageSchema>;
const modelsResponseSchema = z.object({ models: z.array(modelUsageSchema) });

export async function getLlmModels(range: RangeParams): Promise<LlmModelUsage[]> {
  const res = await api.get<unknown>(`${BASE}/llm/models`, { params: range });
  return validateResponse(modelsResponseSchema, res).models;
}
