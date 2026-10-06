import type { DatastoreSystemRow } from "../../../api/datastoresExplorerSchemas";

export interface DatastoreSummary {
  readonly totalSystems: number;
  readonly databaseSystems: number;
  readonly redisSystems: number;
  readonly queryCount: number;
  readonly p95LatencyMs: number;
  readonly errorRate: number;
  readonly activeConnections: number;
}

/**
 * Rolls datastore systems up into one summary. Latency and error rate are
 * weighted by query count; a system that served no queries still counts once.
 */
export function summarizeDatastores(systems: readonly DatastoreSystemRow[]): DatastoreSummary {
  let queryCount = 0;
  let weightedLatency = 0;
  let weightedErrorRate = 0;
  let activeConnections = 0;
  for (const s of systems) {
    const weight = Math.max(s.queryCount, 1);
    queryCount += s.queryCount;
    weightedLatency += s.p95LatencyMs * weight;
    weightedErrorRate += s.errorRate * weight;
    activeConnections += s.activeConnections;
  }
  const denom = Math.max(1, queryCount);
  return {
    totalSystems: systems.length,
    databaseSystems: systems.filter((s) => s.category === "database").length,
    redisSystems: systems.filter((s) => s.category === "redis").length,
    queryCount,
    p95LatencyMs: weightedLatency / denom,
    errorRate: weightedErrorRate / denom,
    activeConnections,
  };
}
