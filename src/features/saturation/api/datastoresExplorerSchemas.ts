import { z } from "zod";

import { integerValue, numericValue, stringValue } from "./saturationClient";

const datastoreSummarySchema = z.object({
  totalSystems: integerValue,
  databaseSystems: integerValue,
  redisSystems: integerValue,
  queryCount: numericValue,
  p95LatencyMs: numericValue,
  errorRate: numericValue,
  activeConnections: numericValue,
});

export const datastoreSystemRowSchema = z.object({
  system: stringValue,
  category: stringValue,
  queryCount: numericValue,
  avgLatencyMs: numericValue,
  p95LatencyMs: numericValue,
  errorRate: numericValue,
  activeConnections: numericValue,
  region: stringValue,
  lastSeen: stringValue,
});
export type DatastoreSummary = z.infer<typeof datastoreSummarySchema>;
export type DatastoreSystemRow = z.infer<typeof datastoreSystemRowSchema>;
