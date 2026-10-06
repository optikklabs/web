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
  activeUsers: z.number(),
  avgCostPerUser: z.number(),
  avgTracesPerUser: z.number(),
  lowScoreUsers: z.number(),
});
export type LlmUsersOverview = z.infer<typeof overviewSchema>;

const userSchema = z.object({
  userId: z.string(),
  topService: z.string(),
  traces: z.number(),
  tokens: z.number(),
  cost: z.number(),
  avgScore: z.number().nullable(),
  lastSeenMs: z.number(),
});
export type LlmUser = z.infer<typeof userSchema>;
const usersResponseSchema = z.object({ users: z.array(userSchema) });

export async function getUsersOverview(range: RangeParams): Promise<LlmUsersOverview> {
  const res = await api.get<unknown>(`${BASE}/llm/users/overview`, { params: range });
  return validateResponse(overviewSchema, res);
}

export async function queryUsers(range: RangeParams, limit = 100): Promise<LlmUser[]> {
  const res = await api.post<unknown>(`${BASE}/llm/users/query`, { ...range, limit });
  const data = validateResponse(usersResponseSchema, res);
  return data.users;
}
