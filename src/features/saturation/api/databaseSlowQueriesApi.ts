import { z } from "zod";

export const slowQueryPatternSchema = z.object({
  queryHash: z.string().regex(/^[0-9a-f]{16}$/),
  queryText: z.string(),
  dbSystem: z.string(),
  collectionName: z.string(),
  p50Ms: z.number(),
  p95Ms: z.number(),
  p99Ms: z.number(),
  callCount: z.number(),
  errorCount: z.number(),
});

export type SlowQueryPatternRow = z.infer<typeof slowQueryPatternSchema>;

export interface DatabaseFilters {
  readonly dbSystem?: string;
  readonly collection?: string;
}
