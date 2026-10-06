import { z } from "zod";

export const datastoreSystemRowSchema = z.object({
  system: z.string(),
  category: z.string(),
  queryCount: z.number(),
  avgLatencyMs: z.number(),
  p95LatencyMs: z.number(),
  errorRate: z.number(),
  activeConnections: z.number(),
  region: z.string(),
  lastSeen: z.string(),
});
export type DatastoreSystemRow = z.infer<typeof datastoreSystemRowSchema>;
