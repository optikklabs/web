import { API_CONFIG } from "@config/apiConfig";
import { errorGroupSchema } from "@shared/api/errors";
import api from "@shared/api/http/client";
import { validateResponse } from "@shared/api/utils/validate";
import { pageInfoSchema } from "@shared/search/schemas/pageInfo";
import type { ExplorerFacetBucket, ExplorerQueryRequest } from "@shared/search/types/queries";
import { z } from "zod";

import { buildErrorsFilters } from "./buildErrorsFilters";
import type { ErrorGroupsPage, ErrorsFacets, ErrorsOverview } from "./types";

const BASE = API_CONFIG.ENDPOINTS.V1_BASE;

const facetBucketsSchema = z.array(z.object({ value: z.string(), count: z.number() }));

/** Keys mirror Go errors.Facets, which mirrors the DSL field names. */
const facetsSchema = z.object({
  service: facetBucketsSchema,
  operation: facetBucketsSchema,
  httpStatus: facetBucketsSchema,
  exceptionType: facetBucketsSchema,
});

const groupsResponseSchema = z.object({
  results: z.array(errorGroupSchema),
  pageInfo: pageInfoSchema,
});

const overviewSchema = z.object({
  summary: z.object({
    totalErrors: z.number(),
    activeIssues: z.number(),
    newIssues: z.number(),
    servicesAffected: z.number(),
  }),
  trend: z.array(z.object({ timeBucketMs: z.number(), errors: z.number() })),
});

type FilterBody = Pick<ExplorerQueryRequest, "startTime" | "endTime" | "filters">;

function post<T extends z.ZodTypeAny>(
  path: string,
  req: FilterBody,
  schema: T,
  extras?: { limit?: number; cursor?: string }
): Promise<z.infer<T>> {
  const { body } = buildErrorsFilters(req.filters, req.startTime, req.endTime, extras);
  return api
    .post<unknown>(`${BASE}${path}`, body)
    .then((raw) => validateResponse(schema, raw) as z.infer<T>);
}

export async function queryErrorGroups(req: ExplorerQueryRequest): Promise<ErrorGroupsPage> {
  const parsed = await post("/errors/groups/query", req, groupsResponseSchema, {
    limit: req.limit,
    cursor: req.cursor,
  });
  return {
    groups: parsed.results,
    nextCursor: parsed.pageInfo.nextCursor,
  };
}

export async function queryErrorFacets(req: FilterBody): Promise<ErrorsFacets> {
  const parsed = await post("/errors/facets", req, facetsSchema);
  const out: Record<string, readonly ExplorerFacetBucket[]> = {};
  for (const [field, buckets] of Object.entries(parsed)) {
    if (buckets.length > 0) out[field] = buckets;
  }
  return out;
}

export async function queryErrorOverview(req: FilterBody): Promise<ErrorsOverview> {
  return post("/errors/overview", req, overviewSchema);
}
