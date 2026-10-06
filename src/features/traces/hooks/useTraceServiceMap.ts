import { useMemo } from "react";

import type { ServiceTopologyResponse } from "@shared/api/topology";
import { useStandardQuery } from "@shared/hooks/useStandardQuery";

import { tracesService } from "@shared/api/traces/tracesApi";

// Enriches the per-trace service map (from the consolidated trace-detail
// response) with fleet-wide p95/p99 latency baselines.
const MINUTE_MS = 60_000;

export function useTraceServiceMap(
  baseMap: ServiceTopologyResponse | undefined,
  bounds: { startMs?: number; endMs?: number },
  latencyEnabled: boolean
) {
  const startMs = bounds.startMs ?? 0;
  const endMs = bounds.endMs ?? 0;

  // Round to the minute so the baseline query key is stable across traces.
  const fromMs = Math.floor(startMs / MINUTE_MS) * MINUTE_MS;
  const toMs = Math.ceil(endMs / MINUTE_MS) * MINUTE_MS;
  const latencyQuery = useStandardQuery({
    queryKey: ["trace-service-latency", fromMs, toMs],
    queryFn: ({ signal }) => tracesService.getServiceLatencyBaselines(fromMs, toMs, signal),
    enabled: latencyEnabled && startMs > 0 && endMs >= startMs,
    staleTime: 60_000,
  });

  const data = useMemo<ServiceTopologyResponse | undefined>(() => {
    if (!baseMap) return undefined;
    const latency = latencyQuery.data;
    if (!latency || latency.size === 0) return baseMap;
    return {
      nodes: baseMap.nodes.map((n) => {
        const b = latency.get(n.name);
        return b ? { ...n, p95LatencyMs: b.p95, p99LatencyMs: b.p99 } : n;
      }),
      edges: baseMap.edges,
    };
  }, [baseMap, latencyQuery.data]);

  return { data };
}
