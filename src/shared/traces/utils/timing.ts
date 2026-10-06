import type { TraceRecord } from "@shared/api/traces/schemas";

export interface TimingFacts {
  readonly selectedSpan: TraceRecord | null;
  readonly ancestors: readonly TraceRecord[];
  readonly startMs: number;
  readonly endMs: number;
  readonly durMs: number;
  readonly selfMs: number;
  readonly pctOfTrace: number;
}

export function computeSpanTiming(
  spans: readonly TraceRecord[],
  selectedSpanId: string | null,
  traceStartMs?: number,
  traceEndMs?: number
): TimingFacts {
  const selectedSpan = selectedSpanId
    ? (spans.find((s) => s.spanId === selectedSpanId) ?? null)
    : null;
  if (!selectedSpan) {
    return {
      selectedSpan: null,
      ancestors: [],
      startMs: 0,
      endMs: 0,
      durMs: 0,
      selfMs: 0,
      pctOfTrace: 0,
    };
  }

  const byId = new Map(spans.map((s) => [s.spanId, s]));
  const ancestors: TraceRecord[] = [];
  let cur = selectedSpan.parentSpanId ? byId.get(selectedSpan.parentSpanId) : undefined;
  while (cur) {
    ancestors.unshift(cur);
    cur = cur.parentSpanId ? byId.get(cur.parentSpanId) : undefined;
  }

  const startMs = selectedSpan.startTime ? new Date(selectedSpan.startTime).getTime() : 0;
  const durMs = selectedSpan.durationMs;
  const endMs = selectedSpan.endTime ? new Date(selectedSpan.endTime).getTime() : startMs + durMs;

  const children = spans.filter((s) => s.parentSpanId === selectedSpan.spanId);
  const childDurMs = children.reduce((acc, c) => acc + c.durationMs, 0);
  const selfMs = Math.max(0, durMs - childDurMs);

  const tStart = traceStartMs ?? 0;
  const tEnd = traceEndMs ?? tStart;
  const totalTraceMs = Math.max(1, tEnd - tStart);
  const pctOfTrace = Math.min(100, Math.max(0, (durMs / totalTraceMs) * 100));

  return {
    selectedSpan,
    ancestors,
    startMs,
    endMs,
    durMs,
    selfMs,
    pctOfTrace,
  };
}
