import api from "@/shared/api/http/client";
import { validateResponse } from "@/shared/api/utils/validate";
import { API_CONFIG } from "@config/apiConfig";
import { z } from "zod";

const V1 = API_CONFIG.ENDPOINTS.V1_BASE;

const monitorTypeSchema = z.enum(["metric", "apm", "log"]);
const monitorPrioritySchema = z.enum(["P1", "P2", "P3", "P4"]);
const monitorStatusSchema = z.enum(["alert", "warn", "ok", "no_data"]);

export type MonitorType = z.infer<typeof monitorTypeSchema>;
export type MonitorPriority = z.infer<typeof monitorPrioritySchema>;
export type MonitorStatus = z.infer<typeof monitorStatusSchema>;

const scopeSchema = z.object({
  tags: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
});

const metricQuerySchema = z.object({
  metric: z.string(),
  aggregation: z.string(),
  windowSec: z.number(),
});
const apmQuerySchema = z.object({
  service: z.string(),
  resource: z.string().optional(),
  track: z.string(),
  windowSec: z.number(),
});
const logQuerySchema = z.object({
  query: z.string(),
  windowSec: z.number(),
});

export type MetricQueryShape = z.infer<typeof metricQuerySchema>;
export type APMQueryShape = z.infer<typeof apmQuerySchema>;
export type LogQueryShape = z.infer<typeof logQuerySchema>;

const conditionsSchema = z.object({
  comparator: z.enum(["above", "below", "equal"]),
  alertThreshold: z.number().optional(),
  warnThreshold: z.number().optional(),
  recoveryThreshold: z.number().optional(),
  noDataAfterSec: z.number(),
  noDataAs: z.enum(["no_data", "alert", "ok"]),
  minSample: z.number().optional(),
});

export type MonitorConditions = z.infer<typeof conditionsSchema>;

const monitorSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: monitorTypeSchema,
  priority: monitorPrioritySchema,
  status: monitorStatusSchema,
  currentValue: z.number().optional(),
  scope: scopeSchema,
  query: z.object({
    metric: metricQuerySchema.optional(),
    apm: apmQuerySchema.optional(),
    log: logQuerySchema.optional(),
  }),
  conditions: conditionsSchema,
  notify: z.object({ channelIds: z.array(z.number()) }),
  messageBody: z.string().optional(),
  runbookUrl: z.string().optional(),
  tags: z.array(z.string()),
  evalEverySec: z.number(),
  renotifyEverySec: z.number().optional(),
  mutedUntil: z.string().optional(),
  active: z.boolean(),
  lastEvaluatedAt: z.string().optional(),
  triggeredAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type Monitor = z.infer<typeof monitorSchema>;

const statusCountsSchema = z.object({
  alert: z.number(),
  warn: z.number(),
  ok: z.number(),
  noData: z.number(),
  muted: z.number(),
  total: z.number(),
});

export type MonitorListStatusCounts = z.infer<typeof statusCountsSchema>;

const monitorListSchema = z.object({
  items: z.array(monitorSchema),
  counts: statusCountsSchema,
});

export type MonitorListResponse = z.infer<typeof monitorListSchema>;

const monitorEventSchema = z.object({
  id: z.number(),
  monitorId: z.number(),
  monitorName: z.string(),
  kind: z.enum(["triggered", "recovered"]),
  value: z.number().optional(),
  threshold: z.number().optional(),
  peakValue: z.number().optional(),
  resolvedBy: z.string().optional(),
  note: z.string().optional(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
});
const monitorEventsSchema = z.array(monitorEventSchema);

export type MonitorEvent = z.infer<typeof monitorEventSchema>;

const monitorSeriesSchema = z.object({
  points: z.array(z.object({ bucketMs: z.number(), value: z.number() })),
  alertThreshold: z.number().optional(),
  warnThreshold: z.number().optional(),
  recoveryThreshold: z.number().optional(),
});

export type MonitorSeriesResponse = z.infer<typeof monitorSeriesSchema>;

const statusTimelineSchema = z.object({
  bands: z.array(
    z.object({ status: monitorStatusSchema, startedAt: z.string(), endedAt: z.string() })
  ),
  startedAt: z.string(),
  endedAt: z.string(),
});

export type StatusTimelineResponse = z.infer<typeof statusTimelineSchema>;

const testResultSchema = z.object({
  value: z.number(),
  hasData: z.boolean(),
  wouldDecideAs: monitorStatusSchema,
  threshold: z.number(),
});

export type MonitorTestResult = z.infer<typeof testResultSchema>;

export interface ListMonitorsParams {
  readonly status?: readonly MonitorStatus[];
  readonly type?: MonitorType;
  readonly priority?: MonitorPriority;
  readonly muted?: boolean;
  readonly q?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface CreateMonitorPayload {
  name: string;
  type: MonitorType;
  priority: MonitorPriority;
  scope: Monitor["scope"];
  query: Monitor["query"];
  conditions: MonitorConditions;
  notify: Monitor["notify"];
  messageBody?: string;
  runbookUrl?: string;
  tags?: string[];
  evalEverySec: number;
  renotifyEverySec?: number;
}

export async function listMonitors(params: ListMonitorsParams = {}): Promise<MonitorListResponse> {
  return validateResponse(monitorListSchema, await api.get<unknown>(`${V1}/monitors`, { params }));
}

export async function getMonitor(id: number): Promise<Monitor> {
  return validateResponse(monitorSchema, await api.get<unknown>(`${V1}/monitors/${id}`));
}

export async function createMonitor(payload: CreateMonitorPayload): Promise<Monitor> {
  return validateResponse(monitorSchema, await api.post<unknown>(`${V1}/monitors`, payload));
}

export async function updateMonitor(id: number, payload: CreateMonitorPayload): Promise<Monitor> {
  return validateResponse(monitorSchema, await api.put<unknown>(`${V1}/monitors/${id}`, payload));
}

export async function deleteMonitor(id: number): Promise<void> {
  await api.delete<unknown>(`${V1}/monitors/${id}`);
}

export async function ackMonitor(id: number): Promise<void> {
  await api.post<unknown>(`${V1}/monitors/${id}/ack`, {});
}

export async function muteMonitor(id: number, durationSec: number): Promise<void> {
  await api.post<unknown>(`${V1}/monitors/${id}/mute`, { durationSec });
}

export async function unmuteMonitor(id: number): Promise<void> {
  await api.post<unknown>(`${V1}/monitors/${id}/unmute`, {});
}

export async function testMonitor(id: number): Promise<MonitorTestResult> {
  return validateResponse(
    testResultSchema,
    await api.post<unknown>(`${V1}/monitors/${id}/test`, {})
  );
}

export async function getMonitorSeries(
  id: number,
  windowMs: number
): Promise<MonitorSeriesResponse> {
  return validateResponse(
    monitorSeriesSchema,
    await api.get<unknown>(`${V1}/monitors/${id}/series`, { params: { windowMs } })
  );
}

export async function getMonitorEvents(id: number, limit: number): Promise<MonitorEvent[]> {
  return validateResponse(
    monitorEventsSchema,
    await api.get<unknown>(`${V1}/monitors/${id}/events`, { params: { limit } })
  );
}

export async function getMonitorStatusTimeline(
  id: number,
  windowMs: number
): Promise<StatusTimelineResponse> {
  return validateResponse(
    statusTimelineSchema,
    await api.get<unknown>(`${V1}/monitors/${id}/status-timeline`, { params: { windowMs } })
  );
}

/** Events since `sinceMs`; the server defaults to the last hour when omitted. */
export async function getMonitorsActivity(
  limit: number,
  sinceMs?: number
): Promise<MonitorEvent[]> {
  return validateResponse(
    monitorEventsSchema,
    await api.get<unknown>(`${V1}/monitors/activity`, { params: { limit, since: sinceMs } })
  );
}
