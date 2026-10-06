import api from "@/shared/api/http/client";
import { validateResponse } from "@/shared/api/utils/validate";
import { API_CONFIG } from "@config/apiConfig";
import { z } from "zod";

const V1 = API_CONFIG.ENDPOINTS.V1_BASE;
const BASE = `${V1}/notifications`;

const channelSchema = z.object({
  id: z.number(),
  type: z.literal("slack"),
  name: z.string(),
  config: z.object({ webhookConfigured: z.boolean() }),
  status: z.enum(["ok", "warn"]),
  usedByCount: z.number(),
  lastUsedAt: z.string().optional(),
  lastDeliveryAt: z.string().optional(),
  lastErrorText: z.string().optional(),
  createdAt: z.string(),
});

const integrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  desc: z.string(),
  status: z.enum(["connected", "not_connected"]),
  count: z.number(),
  color: z.string(),
});

const policySchema = z.object({
  id: z.number(),
  name: z.string(),
  matchDsl: z.string(),
  actions: z.array(z.unknown()),
  hits30d: z.number(),
  lastUsedAt: z.string().optional(),
  enabled: z.boolean(),
  position: z.number(),
  createdAt: z.string(),
});

const templateSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  body: z.string(),
  usedCount: z.number(),
  createdAt: z.string(),
});

const testChannelSchema = z.object({
  ok: z.boolean(),
  errorText: z.string().optional(),
});

export type Channel = z.infer<typeof channelSchema>;
export type Integration = z.infer<typeof integrationSchema>;
export type Policy = z.infer<typeof policySchema>;
export type Template = z.infer<typeof templateSchema>;
export type TestChannelResult = z.infer<typeof testChannelSchema>;

// Channels ------------------------------------------------------------------

export interface CreateChannelPayload {
  type: Channel["type"];
  name: string;
  /** Omit `webhookUrl` on update to keep the stored one. */
  config: { webhookUrl?: string };
}

export async function listChannels(): Promise<Channel[]> {
  return validateResponse(z.array(channelSchema), await api.get<unknown>(`${BASE}/channels`));
}

export async function createChannel(payload: CreateChannelPayload): Promise<Channel> {
  return validateResponse(channelSchema, await api.post<unknown>(`${BASE}/channels`, payload));
}

export async function updateChannel(id: number, payload: CreateChannelPayload): Promise<Channel> {
  return validateResponse(channelSchema, await api.put<unknown>(`${BASE}/channels/${id}`, payload));
}

export async function deleteChannel(id: number): Promise<void> {
  await api.delete<unknown>(`${BASE}/channels/${id}`);
}

export async function testChannel(id: number): Promise<TestChannelResult> {
  return validateResponse(
    testChannelSchema,
    await api.post<unknown>(`${BASE}/channels/${id}/test`, {})
  );
}

export async function listIntegrations(): Promise<Integration[]> {
  return validateResponse(
    z.array(integrationSchema),
    await api.get<unknown>(`${BASE}/integrations`)
  );
}

// Policies ------------------------------------------------------------------

export interface CreatePolicyPayload {
  name: string;
  matchDsl: string;
  actions: unknown[];
  enabled?: boolean;
  position?: number;
}

export async function listPolicies(): Promise<Policy[]> {
  return validateResponse(z.array(policySchema), await api.get<unknown>(`${BASE}/policies`));
}

export async function createPolicy(payload: CreatePolicyPayload): Promise<Policy> {
  return validateResponse(policySchema, await api.post<unknown>(`${BASE}/policies`, payload));
}

export async function updatePolicy(id: number, payload: CreatePolicyPayload): Promise<Policy> {
  return validateResponse(policySchema, await api.put<unknown>(`${BASE}/policies/${id}`, payload));
}

export async function deletePolicy(id: number): Promise<void> {
  await api.delete<unknown>(`${BASE}/policies/${id}`);
}

// Templates -----------------------------------------------------------------

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  body: string;
}

export async function listTemplates(): Promise<Template[]> {
  return validateResponse(z.array(templateSchema), await api.get<unknown>(`${BASE}/templates`));
}

export async function createTemplate(payload: CreateTemplatePayload): Promise<Template> {
  return validateResponse(templateSchema, await api.post<unknown>(`${BASE}/templates`, payload));
}

export async function updateTemplate(
  id: number,
  payload: CreateTemplatePayload
): Promise<Template> {
  return validateResponse(
    templateSchema,
    await api.put<unknown>(`${BASE}/templates/${id}`, payload)
  );
}

export async function deleteTemplate(id: number): Promise<void> {
  await api.delete<unknown>(`${BASE}/templates/${id}`);
}
