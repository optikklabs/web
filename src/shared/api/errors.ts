import { z } from "zod";

import api from "@/shared/api/http/client";
import type { PaginatedResponse, RequestTime } from "@/shared/api/service-types";
import { API_CONFIG } from "@config/apiConfig";
import { validateResponse } from "@shared/api/utils/validate";
import { pageInfoSchema } from "@shared/search/schemas/pageInfo";

const V1 = API_CONFIG.ENDPOINTS.V1_BASE;

// Backend may serialize absent strings as null; the public contract is `?: string`.
const optionalString = z
  .string()
  .nullish()
  .transform((value) => value ?? undefined);

export interface ErrorGroup {
  readonly groupId: string;
  readonly serviceName: string;
  readonly operationName: string;
  readonly statusMessage: string;
  readonly httpStatusCode: number;
  readonly errorCount: number;
  readonly lastOccurrence: string;
  readonly firstOccurrence: string;
  readonly sampleTraceId: string;
}

export const errorGroupSchema = z.object({
  groupId: z.string(),
  serviceName: z.string(),
  operationName: z.string(),
  statusMessage: z.string(),
  httpStatusCode: z.number(),
  errorCount: z.number(),
  lastOccurrence: z.string(),
  firstOccurrence: z.string(),
  sampleTraceId: z.string(),
});

export interface ErrorGroupDetail {
  readonly groupId: string;
  readonly serviceName: string;
  readonly operationName: string;
  readonly httpStatusCode: number;
  readonly errorCount: number;
  readonly lastOccurrence: string;
  readonly firstOccurrence: string;
  readonly exceptionType?: string;
}

const errorGroupDetailSchema = z.object({
  groupId: z.string(),
  serviceName: z.string(),
  operationName: z.string(),
  httpStatusCode: z.number(),
  errorCount: z.number(),
  lastOccurrence: z.string(),
  firstOccurrence: z.string(),
  exceptionType: optionalString,
});

export interface ErrorLatestOccurrence {
  readonly traceId: string;
  readonly spanId: string;
  readonly timestamp: string;
  readonly durationMs: number;
  readonly message: string;
  readonly stacktrace?: string;
  readonly httpMethod: string;
  readonly httpRoute: string;
  readonly httpStatusCode: string;
  readonly serviceVersion: string;
  readonly environment: string;
  readonly pod: string;
  readonly host: string;
}

const errorLatestOccurrenceSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  timestamp: z.string(),
  durationMs: z.number(),
  message: z.string(),
  stacktrace: optionalString,
  httpMethod: z.string(),
  httpRoute: z.string(),
  httpStatusCode: z.string(),
  serviceVersion: z.string(),
  environment: z.string(),
  pod: z.string(),
  host: z.string(),
});

interface ErrorFacet {
  readonly name: string;
  readonly count: number;
  readonly pct: number;
}

export interface ErrorFacetGroup {
  readonly key: string;
  readonly facets: ErrorFacet[];
}

const errorFacetGroupSchema = z.object({
  key: z.string(),
  facets: z.array(
    z.object({
      name: z.string(),
      count: z.number(),
      pct: z.number(),
    })
  ),
});

export interface ErrorGroupTrace {
  readonly traceId: string;
  readonly spanId: string;
  readonly timestamp: string;
  readonly durationMs: number;
  readonly statusCode: string;
}

const errorGroupTraceSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  timestamp: z.string(),
  durationMs: z.number(),
  statusCode: z.string(),
});

export interface ErrorTimeSeriesPoint {
  readonly serviceName: string;
  readonly timestampMs: number;
  readonly requestCount: number;
  readonly errorCount: number;
}

// errorRate/avgLatency are serialized by the backend (TimeSeriesPoint) but not
// part of the web contract yet; declared so they don't register as drift.
const errorTimeSeriesPointSchema = z.object({
  serviceName: z.string(),
  timestampMs: z.number(),
  requestCount: z.number(),
  errorCount: z.number(),
  errorRate: z.number().nullish(),
  avgLatency: z.number().nullish(),
});

function paginatedSchema<TSchema extends z.ZodTypeAny>(results: TSchema) {
  return z.object({ results, pageInfo: pageInfoSchema });
}

function range(s: RequestTime, e: RequestTime, extra?: Record<string, unknown>) {
  return { startTime: s, endTime: e, ...extra };
}

export async function getErrorGroupDetail(
  groupId: string,
  s: RequestTime,
  e: RequestTime
): Promise<ErrorGroupDetail | null> {
  const res = await api.get<unknown>(`${V1}/errors/groups/${encodeURIComponent(groupId)}`, {
    params: range(s, e),
  });
  return validateResponse(errorGroupDetailSchema.nullable(), res ?? null);
}

export async function getErrorGroupLatestOccurrence(
  groupId: string,
  s: RequestTime,
  e: RequestTime
): Promise<ErrorLatestOccurrence | null> {
  const res = await api.get<unknown>(
    `${V1}/errors/groups/${encodeURIComponent(groupId)}/latest-occurrence`,
    { params: range(s, e) }
  );
  return validateResponse(errorLatestOccurrenceSchema.nullable(), res ?? null);
}

export async function getErrorGroupFacets(
  groupId: string,
  s: RequestTime,
  e: RequestTime
): Promise<ErrorFacetGroup[]> {
  const res = await api.get<unknown>(`${V1}/errors/groups/${encodeURIComponent(groupId)}/facets`, {
    params: range(s, e),
  });
  return validateResponse(z.array(errorFacetGroupSchema), res ?? []);
}

export async function getErrorGroupTraces(
  groupId: string,
  s: RequestTime,
  e: RequestTime,
  p?: { limit?: number; cursor?: string }
): Promise<PaginatedResponse<ErrorGroupTrace[]>> {
  const res = await api.get<unknown>(`${V1}/errors/groups/${encodeURIComponent(groupId)}/traces`, {
    params: range(s, e, { limit: 20, ...p }),
  });
  return validateResponse(paginatedSchema(z.array(errorGroupTraceSchema)), res);
}

export async function getErrorGroupTimeseries(
  groupId: string,
  s: RequestTime,
  e: RequestTime
): Promise<ErrorTimeSeriesPoint[]> {
  const res = await api.get<unknown>(
    `${V1}/errors/groups/${encodeURIComponent(groupId)}/timeseries`,
    { params: range(s, e) }
  );
  return validateResponse(z.array(errorTimeSeriesPointSchema), res ?? []);
}

export async function getServiceErrorRate(
  s: RequestTime,
  e: RequestTime,
  p?: { serviceName?: string }
): Promise<ErrorTimeSeriesPoint[]> {
  const res = await api.get<unknown>(`${V1}/errors/service-error-rate`, { params: range(s, e, p) });
  return validateResponse(z.array(errorTimeSeriesPointSchema), res ?? []);
}
