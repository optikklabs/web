import { useMemo } from "react";

import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import { getLatencyBySystem } from "@/features/saturation/api/databaseLatencyApi";
import type { LatencySeriesPoint } from "@/features/saturation/api/databaseSeriesSchemas";

// Per-system p95 trend, keyed by db.system, for the list-row sparklines.
function groupP95BySystem(rows: LatencySeriesPoint[]): Map<string, number[]> {
  const byKey = new Map<string, Array<{ ts: number; v: number }>>();
  for (const row of rows) {
    if (row.p95Ms == null) continue;
    const ts = row.timeBucketMs;
    const list = byKey.get(row.groupBy) ?? [];
    list.push({ ts, v: row.p95Ms });
    byKey.set(row.groupBy, list);
  }
  const out = new Map<string, number[]>();
  for (const [key, list] of byKey) {
    list.sort((a, b) => a.ts - b.ts);
    out.set(
      key,
      list.map((p) => p.v)
    );
  }
  return out;
}

export function useDatabaseSystemSparklines(): Map<string, number[]> {
  const { data } = useTimeRangeQuery<LatencySeriesPoint[]>(
    "saturation-db.system-sparklines",
    (s, e) => getLatencyBySystem(s, e)
  );
  return useMemo(() => groupP95BySystem(data ?? []), [data]);
}
