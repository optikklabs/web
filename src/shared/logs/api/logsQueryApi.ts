import { z } from "zod";

import { API_CONFIG } from "@config/apiConfig";
import { api } from "@shared/api/http/client";
import { validateResponse } from "@shared/api/utils/validate";
import { pageInfoSchema } from "@shared/search/schemas/pageInfo";
import type { ExplorerFilter } from "@shared/search/types/filters";

const V1 = API_CONFIG.ENDPOINTS.V1_BASE;

import type { LogRecord, LogsQueryResponse } from "../types/log";
import { buildLogsFilters } from "./buildLogsFilters";

/**
 * Mirrors logs models.Log. Only the `attributes_*` maps are `omitempty` on the
 * Go side; every other field is always present on the wire.
 */
export const rawLogRowSchema = z.object({
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

/** Converts the API's Unix-nanosecond timestamp string to ISO 8601. */
export function nsToIso(ns: string): string {
  return new Date(Number(BigInt(ns) / 1_000_000n)).toISOString();
}

export function normalizeLogRecord(row: z.infer<typeof rawLogRowSchema>): LogRecord {
  return {
    id: row.id,
    timestamp: nsToIso(row.timestamp),
    observedTimestamp: nsToIso(row.observedTimestamp),
    serviceName: row.serviceName,
    severityText: row.severityText,
    severityBucket: row.severityBucket,
    body: row.body,
    host: row.host,
    pod: row.pod,
    container: row.container,
    environment: row.environment,
    scopeName: row.scopeName,
    scopeVersion: row.scopeVersion,
    traceId: row.traceId,
    spanId: row.spanId,
    attributesString: row.attributesString,
    attributesNumber: row.attributesNumber,
    attributesBool: row.attributesBool,
  };
}

const queryResponseSchema = z
  .object({
    results: z.array(rawLogRowSchema),
    pageInfo: pageInfoSchema,
  })
  .transform(
    (r): LogsQueryResponse => ({
      results: r.results.map(normalizeLogRecord),
      cursor: r.pageInfo.nextCursor,
      hasMore: r.pageInfo.hasMore,
    })
  );

export interface QueryLogsArgs {
  readonly startTime: number;
  readonly endTime: number;
  readonly filters: readonly ExplorerFilter[];
  readonly cursor?: string;
  readonly limit?: number;
}

export async function queryLogs(args: QueryLogsArgs): Promise<LogsQueryResponse> {
  const { body } = buildLogsFilters(args.filters, args.startTime, args.endTime, {
    cursor: args.cursor,
    limit: args.limit,
  });
  const raw = await api.post<unknown>(`${V1}/logs/query`, body);
  return validateResponse(queryResponseSchema, raw);
}
