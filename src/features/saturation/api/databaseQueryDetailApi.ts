import { z } from "zod";

import type { RequestTime } from "@/shared/api/service-types";

import type { DatabaseFilters } from "./databaseSlowQueriesApi";
import { getSaturation, rangeParams } from "./saturationClient";

const nullableNumber = z.number().nullable();

const serviceCallsSchema = z.object({
  service: z.string(),
  callCount: z.number(),
});

const queryDetailSummarySchema = z.object({
  queryHash: z.string().regex(/^[0-9a-f]{16}$/),
  queryText: z.string(),
  dbSystem: z.string(),
  collectionName: z.string(),
  operationName: z.string(),
  callCount: z.number(),
  errorCount: z.number(),
  p50Ms: nullableNumber,
  p95Ms: nullableNumber,
  p99Ms: nullableNumber,
  avgMs: z.number(),
  totalTimeMs: z.number(),
  avgRows: nullableNumber,
  services: z.array(serviceCallsSchema),
});

export type QueryDetailSummary = z.infer<typeof queryDetailSummarySchema>;

const queryTimeseriesPointSchema = z.object({
  timeBucketMs: z.number(),
  callCount: z.number(),
  errorCount: z.number(),
  avgMs: nullableNumber,
  p99Ms: nullableNumber,
});

export type QueryTimeseriesPoint = z.infer<typeof queryTimeseriesPointSchema>;

const queryExecutionSchema = z.object({
  timestamp: z.string(),
  traceId: z.string(),
  spanId: z.string(),
  durationMs: z.number(),
  isError: z.boolean(),
  service: z.string(),
  host: z.string(),
  rows: nullableNumber,
});

export type QueryExecutionRow = z.infer<typeof queryExecutionSchema>;

function withHash(
  hash: string,
  startTime: RequestTime,
  endTime: RequestTime,
  filters?: DatabaseFilters,
  extra?: Record<string, string | number | undefined>
) {
  return { ...rangeParams(startTime, endTime), hash, ...filters, ...extra };
}

export function getQueryDetailSummary(
  hash: string,
  startTime: RequestTime,
  endTime: RequestTime,
  filters?: DatabaseFilters
): Promise<QueryDetailSummary> {
  return getSaturation(
    "/saturation/database/query-detail/summary",
    queryDetailSummarySchema,
    withHash(hash, startTime, endTime, filters)
  );
}

export function getQueryDetailTimeseries(
  hash: string,
  startTime: RequestTime,
  endTime: RequestTime,
  filters?: DatabaseFilters
): Promise<QueryTimeseriesPoint[]> {
  return getSaturation(
    "/saturation/database/query-detail/timeseries",
    z.array(queryTimeseriesPointSchema),
    withHash(hash, startTime, endTime, filters)
  );
}

export function getQueryDetailExecutions(
  hash: string,
  startTime: RequestTime,
  endTime: RequestTime,
  filters?: DatabaseFilters,
  limit = 50
): Promise<QueryExecutionRow[]> {
  return getSaturation(
    "/saturation/database/query-detail/executions",
    z.array(queryExecutionSchema),
    withHash(hash, startTime, endTime, filters, { limit })
  );
}
