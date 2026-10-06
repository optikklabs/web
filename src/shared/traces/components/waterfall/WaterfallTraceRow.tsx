import { cn } from "@shared/lib/utils";
import { formatDuration } from "@shared/utils/formatters";
import { AlertCircle, ChevronDown, RotateCw } from "lucide-react";
import { memo } from "react";
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
  const { span, depth, hasChildren, startMs, endMs } = row;
  const dur = Math.max(0, endMs - startMs);
  const leftPct = totalMs > 0 ? Math.max(0, ((startMs - traceStartMs) / totalMs) * 100) : 0;
  const widthPctRaw = totalMs > 0 ? (dur / totalMs) * 100 : 0;
  const widthPct = Math.max(0.4, widthPctRaw);
  const endPct = leftPct + widthPct;
  const flipLeft = endPct > 80;
  const isErr = span.status.toUpperCase() === "ERROR";
  const isSelected = selectedSpanId === span.spanId;
  const hue = svcHue(span.serviceName || "");
  const barColor = `oklch(0.62 0.14 ${hue})`;
  const swatchColor = barColor;

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
          style={{ background: swatchColor }}
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
        {isErr && (
          <span className="ml-auto inline-flex flex-none items-center gap-[3px] rounded-full bg-error-subtle px-1.5 py-px font-mono text-[10px] text-error">
            <AlertCircle size={9} /> error
          </span>
        )}
        {!isErr && isErrPath && (
          <span className="ml-auto inline-flex flex-none items-center gap-[3px] rounded-full bg-warning-subtle px-1.5 py-px font-mono text-[10px] text-warning">
            <RotateCw size={9} /> err-path
          </span>
        )}
      </div>

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
              isSelected ? "text-foreground" : "text-foreground-secondary"
            )}
            style={
              flipLeft
                ? { right: `calc(${100 - leftPct}% + 6px)` }
                : { left: `calc(${endPct}% + 6px)` }
            }
          >
            {formatDuration(dur)}
          </span>
          {events?.map((ev, i) => {
            if (totalMs <= 0) return null;
            const pct = ((ev.tMs - traceStartMs) / totalMs) * 100;
            if (pct < 0 || pct > 100) return null;
            const dotBg =
              ev.level === "error"
                ? "bg-error shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-error),transparent_70%)]"
                : ev.level === "warn"
                  ? "bg-warning"
                  : "bg-primary";
            return (
              <span
                key={`${ev.tMs}-${i}`}
                className={cn(
                  "-translate-x-1/2 -translate-y-1/2 pointer-events-auto absolute top-1/2 z-[1] h-2 w-2 rounded-full border-2 border-background",
                  dotBg
                )}
                style={{ left: `${pct}%` }}
                title={`${ev.level}: ${ev.name}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const WaterfallTraceRow = memo(WaterfallTraceRowComponent);
