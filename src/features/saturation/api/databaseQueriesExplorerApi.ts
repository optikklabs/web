import { API_CONFIG } from "@config/apiConfig";
import api from "@shared/api/http/client";
import { validateResponse } from "@shared/api/utils/validate";
import { pageInfoSchema } from "@shared/search/schemas/pageInfo";
import type { ExplorerFilter, TranslationWarning } from "@shared/search/types/filters";
import type { ExplorerQueryRequest } from "@shared/search/types/queries";
import { ownEntry } from "@shared/utils/ownEntry";
import { z } from "zod";

import { type SlowQueryPatternRow, slowQueryPatternSchema } from "./databaseSlowQueriesApi";

interface QueryPatternsPage {
  readonly rows: readonly SlowQueryPatternRow[];
  readonly nextCursor?: string;
}

interface QueryPatternsBody {
  startTime: number;
  endTime: number;
  limit: number;
  cursor?: string;
  dbSystems?: string[];
  collections?: string[];
  services?: string[];
  queryText?: string;
  minCallCount?: number;
  maxCallCount?: number;
  minErrorCount?: number;
  maxErrorCount?: number;
  minP50Ms?: number;
  maxP50Ms?: number;
  minP95Ms?: number;
  maxP95Ms?: number;
  minP99Ms?: number;
  maxP99Ms?: number;
}

const responseSchema = z.object({
  results: z.array(slowQueryPatternSchema),
  pageInfo: pageInfoSchema,
});

const STRING_FIELDS = {
  dbSystem: "dbSystems",
  collection: "collections",
  service: "services",
} as const;

const NUMBER_FIELDS = {
  callCount: ["minCallCount", "maxCallCount"],
  errorCount: ["minErrorCount", "maxErrorCount"],
  p50Ms: ["minP50Ms", "maxP50Ms"],
  p95Ms: ["minP95Ms", "maxP95Ms"],
  p99Ms: ["minP99Ms", "maxP99Ms"],
} as const;

function warning(field: string, message: string): TranslationWarning {
  return { code: "unsupported_op", field, message };
}

function collectSearchFilter(
  filter: ExplorerFilter,
  terms: string[],
  warnings: TranslationWarning[]
): boolean {
  if (filter.field !== "search" && filter.field !== "queryText") return false;
  if (filter.op === "contains" || filter.op === "eq") terms.push(filter.value);
  else warnings.push(warning(filter.field, `${filter.field} supports contains or exact matching`));
  return true;
}

function applyStringFilter(
  filter: ExplorerFilter,
  body: QueryPatternsBody,
  warnings: TranslationWarning[]
): boolean {
  const key = ownEntry(STRING_FIELDS, filter.field);
  if (key === undefined) return false;
  if (filter.op !== "eq" && filter.op !== "in") {
    warnings.push(warning(filter.field, `${filter.field} supports exact or IN matching`));
    return true;
  }
  body[key] = filter.value
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return true;
}

function applyNumberFilter(
  filter: ExplorerFilter,
  body: QueryPatternsBody,
  warnings: TranslationWarning[]
): boolean {
  const keys = ownEntry(NUMBER_FIELDS, filter.field);
  if (keys === undefined) return false;
  const value = Number(filter.value);
  if (!Number.isFinite(value) || !["eq", "gt", "gte", "lt", "lte"].includes(filter.op)) {
    warnings.push(warning(filter.field, `${filter.field} requires a numeric comparison`));
    return true;
  }
  const [minKey, maxKey] = keys;
  const step = filter.field === "callCount" || filter.field === "errorCount" ? 1 : 0;
  if (filter.op === "eq" || filter.op === "gte") body[minKey] = value;
  if (filter.op === "gt") body[minKey] = value + step;
  if (filter.op === "eq" || filter.op === "lte") body[maxKey] = value;
  if (filter.op === "lt") body[maxKey] = value - step;
  return true;
}

export function buildDatabaseQueryBody(req: ExplorerQueryRequest): {
  body: QueryPatternsBody;
  warnings: readonly TranslationWarning[];
} {
  const body: QueryPatternsBody = {
    startTime: req.startTime,
    endTime: req.endTime,
    limit: req.limit,
    cursor: req.cursor,
  };
  const warnings: TranslationWarning[] = [];
  const searchTerms: string[] = [];

  for (const filter of req.filters) {
    if (collectSearchFilter(filter, searchTerms, warnings)) continue;
    if (applyStringFilter(filter, body, warnings)) continue;
    if (applyNumberFilter(filter, body, warnings)) continue;
    warnings.push({
      code: "unknown_field",
      field: filter.field,
      message: `Unknown database query field: ${filter.field}`,
    });
  }

  if (searchTerms.length > 0) body.queryText = searchTerms.join(" ");
  return { body, warnings };
}

export async function queryDatabasePatterns(req: ExplorerQueryRequest): Promise<QueryPatternsPage> {
  const { body } = buildDatabaseQueryBody(req);
  const raw = await api.post<unknown>(
    `${API_CONFIG.ENDPOINTS.V1_BASE}/database/queries/query`,
    body
  );
  const parsed = validateResponse(responseSchema, raw);
  return {
    rows: parsed.results,
    nextCursor: parsed.pageInfo.hasMore ? (parsed.pageInfo.nextCursor ?? undefined) : undefined,
  };
}

export type { QueryPatternsPage };
