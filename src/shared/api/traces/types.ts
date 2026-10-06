/**
 * Traces explorer types — the v1 wire shape consumed by `tracesExplorerApi`
 * and the list/detail/analytics surfaces. Trace rows come from the
 * backend `traces_index` table (one row per completed trace).
 */
import type { ExplorerFilter } from "@shared/search/types/filters";
import type { ExplorerFacetBucket, ExplorerIncludeFlag } from "@shared/search/types/queries";
import { z } from "zod";

export const traceSummarySchema = z.object({
  traceId: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  durationMs: z.number(),
  rootService: z.string(),
  rootOperation: z.string(),
  rootStatus: z.string().optional(),
  rootHttpMethod: z.string().optional(),
  rootHttpStatus: z.string().optional(),
  rootEndpoint: z.string().optional(),
  environment: z.string().optional(),
  spanCount: z.number(),
  hasError: z.boolean(),
  errorCount: z.number(),
  serviceSet: z.array(z.string()),
  truncated: z.boolean().optional(),
});

export type TraceSummary = z.infer<typeof traceSummarySchema>;

export interface TracesQueryRequest {
  readonly startTime: number;
  readonly endTime: number;
  readonly filters: readonly ExplorerFilter[];
  readonly cursor?: string;
  readonly limit: number;
  readonly include?: readonly ExplorerIncludeFlag[];
}

/** POST /traces/facets, keyed by facet dimension. */
export type TracesFacets = Readonly<Record<string, readonly ExplorerFacetBucket[]>>;

/**
 * POST /traces/query. Mirrors Go explorer.QueryResponse, which carries only
 * results + pageInfo. Facets and trend are separate endpoints, and `summary`
 * is derived client-side from the trend buckets — see useTracesExplorer.
 */
export interface TracesQueryResponse {
  readonly traces: readonly TraceSummary[];
  readonly nextCursor?: string;
}
