import { cn } from "@shared/lib/utils";
import { formatDuration } from "@shared/utils/formatters";
import { AlertCircle, ChevronDown, RotateCw } from "lucide-react";
import { type CSSProperties, memo } from "react";
import { svcHue } from "../../utils/color";
import type { BarEvent, FlatSpan } from "../../utils/tree";

export const wfGrid = "grid grid-cols-[360px_1fr]";
export const lblBase = "px-3 flex items-center gap-2 border-r border-border text-[12px] min-w-0";

interface RowProps {
  readonly row: FlatSpan;
  readonly selectedSpanId: string | null;
  readonly traceStartMs: number;
  readonly totalMs: number;
  readonly isCrit: boolean;
  readonly isErrPath: boolean;
  readonly dim: boolean;
  readonly collapsed: boolean;
  readonly events?: readonly BarEvent[];
  readonly onClick: () => void;
  readonly onToggle: () => void;
}

function WaterfallTraceRowComponent({
  row,
  selectedSpanId,
  traceStartMs,
  totalMs,
  isCrit,
  isErrPath,
  dim,
  collapsed,
  events,
  onClick,
  onToggle,
}: RowProps) {
  const { span, depth, hasChildren } = row;
  const isErr = span.status.toUpperCase() === "ERROR";
  const isSelected = selectedSpanId === span.spanId;
  const hue = svcHue(span.serviceName || "");
  const barColor = `oklch(0.62 0.14 ${hue})`;

  return (
    <div
      className={cn(
        wfGrid,
        "ease h-[28px] cursor-pointer border-[color-mix(in_oklch,var(--border-color),transparent_70%)] border-b transition-[background] duration-80 hover:bg-secondary",
        isSelected && "bg-[var(--color-primary-subtle-15)]",
        dim && "opacity-[0.35]"
      )}
      onClick={onClick}
      role="treeitem"
      aria-expanded={hasChildren ? !collapsed : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className={cn(lblBase, isSelected && "shadow-[inset_2px_0_0_var(--color-primary)]")}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button
          type="button"
          className={cn(
            "ease inline-grid h-[14px] w-[14px] flex-none cursor-pointer place-items-center rounded-[3px] border-0 bg-transparent text-foreground-caption transition-transform duration-120 hover:bg-muted hover:text-foreground",
            !hasChildren && "invisible",
            collapsed && "[&_svg]:-rotate-90"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle();
          }}
          aria-label={hasChildren ? (collapsed ? "Expand" : "Collapse") : ""}
        >
          {hasChildren && <ChevronDown size={12} />}
        </button>
        <span
          className="inline-block h-[7px] w-[7px] flex-none shrink-0 grow-0 basis-[7px] rounded-full"
          style={{ background: barColor }}
        />
        <span
          className="max-w-[110px] flex-none overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] text-foreground-muted"
          title={span.serviceName}
        >
          {span.serviceName || "—"}
          {isCrit && (
            <span
              aria-hidden
              className="ml-1.5 inline-block h-1 w-1 rounded-full bg-degraded align-[2px]"
            />
          )}
        </span>
        <span
          className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] text-foreground"
          title={span.operationName}
        >
          {span.operationName || "(no name)"}
        </span>
        <SpanFlag isErr={isErr} isErrPath={isErrPath} />
      </div>

      <SpanBar
        row={row}
        traceStartMs={traceStartMs}
        totalMs={totalMs}
        isErr={isErr}
        isCrit={isCrit}
        isSelected={isSelected}
        barColor={barColor}
        events={events}
      />
    </div>
  );
}

/** The span's bar on the trace timeline, its duration label and event markers. */
function SpanBar({
  row,
  traceStartMs,
  totalMs,
  isErr,
  isCrit,
  isSelected,
  barColor,
  events,
}: {
  readonly row: FlatSpan;
  readonly traceStartMs: number;
  readonly totalMs: number;
  readonly isErr: boolean;
  readonly isCrit: boolean;
  readonly isSelected: boolean;
  readonly barColor: string;
  readonly events?: readonly BarEvent[];
}) {
  const { span, startMs, endMs } = row;
  const dur = Math.max(0, endMs - startMs);
  const leftPct = totalMs > 0 ? Math.max(0, ((startMs - traceStartMs) / totalMs) * 100) : 0;
  const widthPctRaw = totalMs > 0 ? (dur / totalMs) * 100 : 0;
  const widthPct = Math.max(0.4, widthPctRaw);
  const label = durationLabelPlacement(leftPct, leftPct + widthPct);

  return (
    <div className="relative min-w-0 px-3 pr-6">
      <div className="relative h-full">
        <div
          className={cn(
            "-translate-y-1/2 absolute top-1/2 h-3.5 rounded-[3px] shadow-[0_1px_0_oklch(1_0_0/0.08)_inset,0_1px_2px_oklch(0_0_0/0.25)]",
            isErr &&
              "!bg-error !shadow-[0_0_0_1px_var(--color-error-subtle),0_1px_2px_oklch(0_0_0/0.3)]",
            isCrit && "outline outline-1 outline-degraded outline-offset-1"
          )}
          style={{
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            background: isErr ? undefined : barColor,
          }}
          title={`${span.serviceName} · ${span.operationName}\n${formatDuration(dur)} · starts +${formatDuration(startMs - traceStartMs)}`}
        />
        <span
          className={cn(
            "-translate-y-1/2 pointer-events-none absolute top-1/2 whitespace-nowrap font-medium font-mono text-[10.5px] [font-variant-numeric:tabular-nums]",
            label.inside
              ? "text-white"
              : isSelected
                ? "text-foreground"
                : "text-foreground-secondary"
          )}
          style={label.style}
        >
          {formatDuration(dur)}
        </span>
        {events && totalMs > 0 ? (
          <EventDots events={events} traceStartMs={traceStartMs} totalMs={totalMs} />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Where a bar's duration label fits: after the bar, else before it, else
 * inside its right end (a bar spanning the whole timeline has no room outside).
 */
function durationLabelPlacement(
  leftPct: number,
  endPct: number
): { readonly style: CSSProperties; readonly inside: boolean } {
  if (endPct <= 80) return { style: { left: `calc(${endPct}% + 6px)` }, inside: false };
  if (leftPct >= 12) return { style: { right: `calc(${100 - leftPct}% + 6px)` }, inside: false };
  return { style: { right: `calc(${100 - endPct}% + 6px)` }, inside: true };
}

/** Marks an errored span, or a healthy span on the path to an error. */
function SpanFlag({ isErr, isErrPath }: { readonly isErr: boolean; readonly isErrPath: boolean }) {
  if (isErr) {
    return (
      <span className="ml-auto inline-flex flex-none items-center gap-[3px] rounded-full bg-error-subtle px-1.5 py-px font-mono text-[10px] text-error">
        <AlertCircle size={9} /> error
      </span>
    );
  }
  if (isErrPath) {
    return (
      <span className="ml-auto inline-flex flex-none items-center gap-[3px] rounded-full bg-warning-subtle px-1.5 py-px font-mono text-[10px] text-warning">
        <RotateCw size={9} /> err-path
      </span>
    );
  }
  return null;
}

const EVENT_DOT_BG: Record<BarEvent["level"], string> = {
  error: "bg-error shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-error),transparent_70%)]",
  warn: "bg-warning",
  info: "bg-primary",
};

/** Span events plotted on the bar's timeline; events outside the trace are skipped. */
function EventDots({
  events,
  traceStartMs,
  totalMs,
}: {
  readonly events: readonly BarEvent[];
  readonly traceStartMs: number;
  readonly totalMs: number;
}) {
  return events.map((ev, i) => {
    const pct = ((ev.tMs - traceStartMs) / totalMs) * 100;
    if (pct < 0 || pct > 100) return null;
    return (
      <span
        key={`${ev.tMs}-${i}`}
        className={cn(
          "-translate-x-1/2 -translate-y-1/2 pointer-events-auto absolute top-1/2 z-[1] h-2 w-2 rounded-full border-2 border-background",
          EVENT_DOT_BG[ev.level]
        )}
        style={{ left: `${pct}%` }}
        title={`${ev.level}: ${ev.name}`}
      />
    );
  });
}

export const WaterfallTraceRow = memo(WaterfallTraceRowComponent);
