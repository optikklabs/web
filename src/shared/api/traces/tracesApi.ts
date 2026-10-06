import { API_CONFIG } from "@config/apiConfig";
import api from "@shared/api/http/client";
import { type ServiceTopologyResponse, topologyResponseSchema } from "@shared/api/topology";
import {
  criticalPathSpanSchema,
  errorPathSpanSchema,
  relatedTraceSchema,
  spanAttributesSchema,
  spanEventSchema,
  spanRecordSchema,
  traceErrorGroupSchema,
} from "@shared/api/traces/schemas";
import type {
  CriticalPathSpanRecord,
  ErrorPathSpanRecord,
  RelatedTraceRecord,
  SpanAttributesRecord,
  SpanEventRecord,
  SpanRecord,
  TraceErrorGroup,
} from "@shared/api/traces/schemas";
import { validateResponse } from "@shared/api/utils/validate";
import { pageInfoSchema } from "@shared/search/schemas/pageInfo";
import { z } from "zod";
import { buildTracesFilters } from "./buildTracesFilters";
import {
  type TraceSummary,
  type TracesFacets,
  type TracesQueryRequest,
  type TracesQueryResponse,
  traceSummarySchema,
} from "./types";

const BASE = API_CONFIG.ENDPOINTS.V1_BASE;

const facetBucketSchema = z.object({
  value: z.string(),
  count: z.number(),
});

const facetsSchema = z.object({
  service: z.array(facetBucketSchema),
  operation: z.array(facetBucketSchema),
  httpMethod: z.array(facetBucketSchema),
  httpStatus: z.array(facetBucketSchema),
  status: z.array(facetBucketSchema),
});

const trendRowSchema = z.object({
  timeBucketMs: z.number(),
  total: z.number(),
  errors: z.number(),
});

const tracesQueryResponseSchema = z
  .object({
    results: z.array(traceSummarySchema),
    pageInfo: pageInfoSchema,
  })
  .transform(
    (r): TracesQueryResponse => ({
      traces: r.results,
      nextCursor: r.pageInfo.nextCursor,
    })
  );

export async function query(body: TracesQueryRequest): Promise<TracesQueryResponse> {
  const { body: reqBody } = buildTracesFilters(body.filters, body.startTime, body.endTime, {
    limit: body.limit,
    cursor: body.cursor,
  });
  const raw = await api.post<unknown>(`${BASE}/traces/query`, reqBody);
  return validateResponse(tracesQueryResponseSchema, raw);
}

export async function queryFacets(body: TracesQueryRequest) {
  const { body: reqBody } = buildTracesFilters(body.filters, body.startTime, body.endTime);
  const raw = await api.post<unknown>(`${BASE}/traces/facets`, reqBody);
  const facets: TracesFacets = validateResponse(facetsSchema, raw);
  return facets;
}

export async function queryTrend(body: TracesQueryRequest) {
  const { body: reqBody } = buildTracesFilters(body.filters, body.startTime, body.endTime);
  const raw = await api.post<unknown>(`${BASE}/traces/trend`, reqBody);
  return validateResponse(z.array(trendRowSchema), raw);
}

// Consolidated trace detail: summary + span list + server-derived views.
// summary is null when the trace has no spans in the requested range.
const traceDetailResponseSchema = z.object({
  summary: traceSummarySchema.nullable(),
  spans: z.array(spanRecordSchema),
  criticalPath: z.array(criticalPathSpanSchema),
  errorPath: z.array(errorPathSpanSchema),
  serviceMap: topologyResponseSchema,
  errors: z.array(traceErrorGroupSchema),
});

interface TraceDetailResponse {
  readonly summary: TraceSummary | null;
  readonly spans: SpanRecord[];
  readonly criticalPath: CriticalPathSpanRecord[];
  readonly errorPath: ErrorPathSpanRecord[];
  readonly serviceMap: ServiceTopologyResponse;
  readonly errors: TraceErrorGroup[];
}

async function getTraceDetail(
  traceId: string,
  startMs: number,
  endMs: number,
  signal?: AbortSignal
): Promise<TraceDetailResponse> {
  const data = await api.get(`${BASE}/traces/${traceId}`, {
    params: { startTime: startMs, endTime: endMs },
    signal,
  });
  return validateResponse(traceDetailResponseSchema, data);
}

async function getSpanEvents(
  traceId: string,
  startMs: number,
  endMs: number,
  signal?: AbortSignal
): Promise<SpanEventRecord[]> {
  const data = await api.get(`${BASE}/traces/${traceId}/span-events`, {
    params: { startTime: startMs, endTime: endMs },
    signal,
  });
  return validateResponse(z.array(spanEventSchema), data);
}

async function getSpanAttributes(
  traceId: string,
  spanId: string,
  startMs: number,
  endMs: number,
  signal?: AbortSignal
): Promise<SpanAttributesRecord> {
  const data = await api.get(`${BASE}/traces/${traceId}/spans/${spanId}/attributes`, {
    params: { startTime: startMs, endTime: endMs },
    signal,
  });
  return validateResponse(spanAttributesSchema, data);
}

async function getRelatedTraces(
  traceId: string,
  serviceName?: string,
  operationName?: string,
  startMs?: number,
  endMs?: number,
  signal?: AbortSignal
): Promise<RelatedTraceRecord[]> {
  const data = await api.get(`${BASE}/traces/${traceId}/related`, {
    params: {
      service: serviceName,
      operation: operationName,
      startTime: startMs,
      endTime: endMs,
    },
    signal,
  });
  return validateResponse(z.array(relatedTraceSchema), data);
}

interface ServiceLatencyBaseline {
  readonly p95: number;
  readonly p99: number;
}

const fleetOverviewServicesSchema = z.object({
  services: z.array(
    z.object({
      serviceName: z.string(),
      p95Latency: z.number(),
      p99Latency: z.number(),
    })
  ),
});

async function getServiceLatencyBaselines(
  startMs: number,
  endMs: number,
  signal?: AbortSignal
): Promise<Map<string, ServiceLatencyBaseline>> {
  const data = await api.get(`${BASE}/spans/red/fleet-overview`, {
    params: { startTime: startMs, endTime: endMs },
    signal,
  });
  const parsed = validateResponse(fleetOverviewServicesSchema, data);
  const out = new Map<string, ServiceLatencyBaseline>();
  for (const s of parsed.services) {
    out.set(s.serviceName, { p95: s.p95Latency, p99: s.p99Latency });
  }
  return out;
}

export const tracesService = {
  getTraceDetail,
  getSpanEvents,
  getSpanAttributes,
  getRelatedTraces,
  getServiceLatencyBaselines,
};
