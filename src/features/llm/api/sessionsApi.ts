import { API_CONFIG } from "@config/apiConfig";
import api from "@shared/api/http/client";
import { validateResponse } from "@shared/api/utils/validate";
import { z } from "zod";

const BASE = API_CONFIG.ENDPOINTS.V1_BASE;

interface RangeParams {
  startTime: number;
  endTime: number;
}

const overviewSchema = z.object({
  sessions: z.number(),
  // Null when the window has no sessions.
  avgTurns: z.number().nullable(),
  avgDurationMs: z.number().nullable(),
  avgCost: z.number().nullable(),
});
export type LlmSessionsOverview = z.infer<typeof overviewSchema>;

const sessionSchema = z.object({
  sessionId: z.string(),
  service: z.string(),
  userId: z.string(),
  preview: z.string(),
  turns: z.number(),
  durationMs: z.number(),
  cost: z.number(),
  avgScore: z.number().nullable(),
  lastMs: z.number(),
});
export type LlmSession = z.infer<typeof sessionSchema>;
const sessionsResponseSchema = z.object({ sessions: z.array(sessionSchema) });

const turnSchema = z.object({
  traceId: z.string(),
  startMs: z.number(),
  durationMs: z.number(),
  model: z.string(),
  userText: z.string(),
  outputText: z.string(),
  cost: z.number(),
});

const sessionDetailSchema = z.object({
  sessionId: z.string(),
  service: z.string(),
  userId: z.string(),
  turns: z.array(turnSchema),
});
export type LlmSessionDetail = z.infer<typeof sessionDetailSchema>;

export async function getSessionsOverview(range: RangeParams): Promise<LlmSessionsOverview> {
  const res = await api.get<unknown>(`${BASE}/llm/sessions/overview`, { params: range });
  return validateResponse(overviewSchema, res);
}

export async function querySessions(range: RangeParams, limit = 100): Promise<LlmSession[]> {
  const res = await api.post<unknown>(`${BASE}/llm/sessions/query`, { ...range, limit });
  const data = validateResponse(sessionsResponseSchema, res);
  return data.sessions;
}

export async function getSessionDetail(
  sessionId: string,
  range: RangeParams
): Promise<LlmSessionDetail> {
  const res = await api.get<unknown>(`${BASE}/llm/sessions/${encodeURIComponent(sessionId)}`, {
    params: range,
  });
  return validateResponse(sessionDetailSchema, res);
}
