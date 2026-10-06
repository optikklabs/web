import type { CriticalPathSpanRecord, TraceRecord } from "@shared/api/traces/schemas";

export interface CriticalPathSummary {
  readonly spanCount: number;
  readonly durationMs: number;
  /** The span that accounts for most of the path, with its share of it. */
  readonly top: {
    readonly name: string;
    readonly selfMs: number;
    readonly sharePct: number;
  } | null;
}

/**
 * Summarises the server's critical path. Each span's selfMs is the stretch of
 * the path it accounts for, so the values add up to the path's wall time.
 */
export function summarizeCriticalPath(
  criticalPath: readonly CriticalPathSpanRecord[]
): CriticalPathSummary {
  const durationMs = criticalPath.reduce((acc, s) => acc + s.selfMs, 0);
  const top = criticalPath.reduce<CriticalPathSpanRecord | undefined>(
    (best, s) => (best === undefined || s.selfMs > best.selfMs ? s : best),
    undefined
  );
  return {
    spanCount: criticalPath.length,
    durationMs,
    top:
      top === undefined || durationMs <= 0
        ? null
        : {
            name: `${top.serviceName} · ${top.operationName}`,
            selfMs: top.selfMs,
            sharePct: Math.round((top.selfMs / durationMs) * 100),
          },
  };
}

export function computeMaxDepth(spans: readonly TraceRecord[]): number {
  if (!spans.length) return 0;
  const byId = new Map(spans.map((s) => [s.spanId, s]));
  let max = 0;
  for (const s of spans) {
    let d = 0;
    let cur = s.parentSpanId ? byId.get(s.parentSpanId) : undefined;
    while (cur) {
      d += 1;
      cur = cur.parentSpanId ? byId.get(cur.parentSpanId) : undefined;
    }
    if (d > max) max = d;
  }
  return max;
}
