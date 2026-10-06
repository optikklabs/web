import type { TraceRecord } from "@shared/api/traces/schemas";
import { formatDuration } from "@shared/utils/formatters";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useMemo, useRef, useState } from "react";
import type { SpanEvent } from "../../types/detail";
import { type BarEvent, buildFlatTree, eventLevel, matchesQuery, niceStep } from "../../utils/tree";
import { WaterfallHeader } from "./WaterfallHeader";
import { WaterfallTraceRow } from "./WaterfallTraceRow";

const ROW_HEIGHT = 28;

interface Props {
  readonly spans: readonly TraceRecord[];
  readonly selectedSpanId: string | null;
  readonly onSpanClick: (span: { spanId: string }) => void;
  readonly criticalPathSpanIds: ReadonlySet<string>;
  readonly errorPathSpanIds: ReadonlySet<string>;
  readonly search: string;
  readonly spanEvents?: readonly SpanEvent[];
}

function WaterfallTraceComponent({
  spans,
  selectedSpanId,
  onSpanClick,
  criticalPathSpanIds,
  errorPathSpanIds,
  search,
  spanEvents,
}: Props) {
  const eventsBySpan = useMemo(() => {
    const m = new Map<string, BarEvent[]>();
    if (!spanEvents?.length) return m;
    for (const e of spanEvents) {
      const tMs = e.timestamp ? new Date(e.timestamp).getTime() : Number.NaN;
      if (!Number.isFinite(tMs)) continue;
      const arr = m.get(e.spanId);
      const item: BarEvent = { level: eventLevel(e.eventName), tMs, name: e.eventName };
      if (arr) arr.push(item);
      else m.set(e.spanId, [item]);
    }
    return m;
  }, [spanEvents]);

  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { flat, traceStartMs, traceEndMs } = useMemo(
    () => buildFlatTree(spans, collapsed),
    [spans, collapsed]
  );
  const totalMs = Math.max(0, traceEndMs - traceStartMs);

  const ticks = useMemo(() => {
    if (totalMs <= 0) return [] as { t: number; pct: number }[];
    const step = niceStep(totalMs / 8);
    const out: { t: number; pct: number }[] = [];
    for (let t = 0; t <= totalMs; t += step) {
      out.push({ t, pct: (t / totalMs) * 100 });
    }
    return out;
  }, [totalMs]);

  const showCritDot = criticalPathSpanIds.size > 0;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: flat.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <WaterfallHeader ticks={ticks} />

      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-auto">
        <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = flat[virtualRow.index];
            if (!row) return null;
            return (
              <div
                key={row.span.spanId}
                className="absolute top-0 left-0 w-full"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <WaterfallTraceRow
                  row={row}
                  selectedSpanId={selectedSpanId}
                  traceStartMs={traceStartMs}
                  totalMs={totalMs}
                  isCrit={showCritDot && criticalPathSpanIds.has(row.span.spanId)}
                  isErrPath={errorPathSpanIds.has(row.span.spanId)}
                  dim={!matchesQuery(row.span, search)}
                  collapsed={collapsed.has(row.span.spanId)}
                  events={eventsBySpan.get(row.span.spanId)}
                  onClick={() => onSpanClick({ spanId: row.span.spanId })}
                  onToggle={() => toggle(row.span.spanId)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 border-border border-t bg-background px-4 py-2.5 text-[11px] text-foreground-caption">
        <span>
          Showing {flat.length} of {spans.length} span{spans.length === 1 ? "" : "s"}
        </span>
        <span>View: 0 – {formatDuration(totalMs)}</span>
        <span>Click a row to inspect · use the search box above to filter</span>
      </div>
    </div>
  );
}

export const WaterfallTrace = memo(WaterfallTraceComponent);
