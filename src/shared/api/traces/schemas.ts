import { z } from "zod";

/**
 * Wire schemas for the traces API.
 *
 * Required vs optional mirrors the Go json tags in `query`: a field tagged
 * `omitempty` is `.optional()` here, everything else is required. Response
 * schemas do not use `.strict()` — unknown keys are stripped so an additive
 * backend change stays non-breaking (see `validateResponse`).
 */

/**
 * Domain model for a span as rendered by the trace detail UI. This is *not* a
 * wire shape: `normalizeSpan` builds it from `SpanRecord`, deriving
 * start/end times from `startNs`. Never parsed against a response.
 */
const traceRecordSchema = z.object({
  spanId: z.string(),
  traceId: z.string(),
  serviceName: z.string().default(""),
  operationName: z.string().default(""),
  startTime: z.string().default(""),
  endTime: z.string().default(""),
  durationMs: z.number().default(0),
  status: z.string().default("UNSET"),
  spanKind: z.string().default(""),
  statusMessage: z.string().optional(),
  httpMethod: z.string().optional(),
  httpUrl: z.string().optional(),
  httpStatusCode: z.number().optional(),
  serviceNameOriginal: z.string().optional(),
  parentSpanId: z.string().optional(),
  hasError: z.boolean().default(false),
  startNs: z.number().default(0),
});

/** Mirrors detail.SpanListItem — GET /traces/{traceId}/spans. */
export const spanRecordSchema = z.object({
  spanId: z.string(),
  parentSpanId: z.string(),
  traceId: z.string(),
  serviceName: z.string(),
  operationName: z.string(),
  spanKind: z.string(),
  status: z.string(),
  hasError: z.boolean(),
  durationMs: z.number(),
  startNs: z.number(),
});

/** Mirrors logs models.Log — GET /logs/trace/{traceID}. */
export const traceLogSchema = z.object({
  id: z.string(),
  // uint64 `json:",string"` on the Go side — always a JSON string.
  timestamp: z.string(),
  observedTimestamp: z.string(),
  severityText: z.string(),
  severityNumber: z.number(),
  severityBucket: z.number(),
  body: z.string(),
  traceId: z.string(),
  spanId: z.string(),
  traceFlags: z.number(),
  serviceName: z.string(),
  host: z.string(),
  pod: z.string(),
  container: z.string(),
  environment: z.string(),
  attributesString: z.record(z.string(), z.string()).optional(),
  attributesNumber: z.record(z.string(), z.number()).optional(),
  attributesBool: z.record(z.string(), z.boolean()).optional(),
  scopeName: z.string(),
  scopeVersion: z.string(),
});

/** Client-side envelope built by `getTraceLogs`; the wire is a bare array. */
const traceLogsResponseSchema = z.object({
  logs: z.array(traceLogSchema).default([]),
  isSpeculative: z.boolean().default(false),
});

/** Mirrors detail.SpanEvent — GET /traces/{traceId}/span-events. */
export const spanEventSchema = z.object({
  spanId: z.string(),
  traceId: z.string(),
  eventName: z.string(),
  timestamp: z.string(),
  attributes: z.string(),
});

/** Mirrors paths.CriticalPathSpan — GET /traces/{traceId}/critical-path. */
export const criticalPathSpanSchema = z.object({
  spanId: z.string(),
  operationName: z.string(),
  serviceName: z.string(),
  durationMs: z.number(),
});

/** Mirrors paths.ErrorPathSpan — GET /traces/{traceId}/error-path. */
export const errorPathSpanSchema = z.object({
  spanId: z.string(),
  parentSpanId: z.string(),
  operationName: z.string(),
  serviceName: z.string(),
  status: z.string(),
  statusMessage: z.string(),
  startTime: z.string(),
  durationMs: z.number(),
});

/** Mirrors detail.SpanLink. */
const spanLinkSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  traceState: z.string().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
});

/** Mirrors detail.SpanAttributes — GET /traces/{traceId}/spans/{spanId}/attributes. */
export const spanAttributesSchema = z.object({
  spanId: z.string(),
  traceId: z.string(),
  operationName: z.string(),
  serviceName: z.string(),
  attributesString: z.record(z.string(), z.string()),
  resourceAttributes: z.record(z.string(), z.string()),
  links: z.array(spanLinkSchema).optional(),
  exceptionType: z.string().optional(),
  exceptionMessage: z.string().optional(),
  exceptionStacktrace: z.string().optional(),
  dbSystem: z.string().optional(),
  dbName: z.string().optional(),
  dbStatement: z.string().optional(),
  dbStatementNormalized: z.string().optional(),
});

/** Mirrors detail.RelatedTrace — GET /traces/{traceId}/related. */
export const relatedTraceSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  operationName: z.string(),
  serviceName: z.string(),
  durationMs: z.number(),
  status: z.string(),
  startTime: z.string(),
});

export type TraceRecord = z.infer<typeof traceRecordSchema>;
export type SpanRecord = z.infer<typeof spanRecordSchema>;
export type TraceLog = z.infer<typeof traceLogSchema>;
export type TraceLogsResponse = z.infer<typeof traceLogsResponseSchema>;
export type SpanEventRecord = z.infer<typeof spanEventSchema>;
export type CriticalPathSpanRecord = z.infer<typeof criticalPathSpanSchema>;
export type ErrorPathSpanRecord = z.infer<typeof errorPathSpanSchema>;
export type SpanAttributesRecord = z.infer<typeof spanAttributesSchema>;
export type RelatedTraceRecord = z.infer<typeof relatedTraceSchema>;

/** Mirrors servicemap.TraceErrorSpan. */
const traceErrorSpanSchema = z.object({
  spanId: z.string(),
  serviceName: z.string(),
  operationName: z.string(),
  exceptionMessage: z.string().optional(),
  statusMessage: z.string().optional(),
  startTime: z.string(),
  durationMs: z.number(),
});

/** Mirrors servicemap.TraceErrorGroup. */
export const traceErrorGroupSchema = z.object({
  exceptionType: z.string(),
  count: z.number(),
  spans: z.array(traceErrorSpanSchema),
});

export type TraceErrorGroup = z.infer<typeof traceErrorGroupSchema>;

/** Domain models for the service-detail recent-traces list, built client-side. */
