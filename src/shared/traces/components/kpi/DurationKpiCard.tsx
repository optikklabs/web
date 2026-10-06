import { cn } from "@shared/lib/utils";
import { formatDuration } from "@shared/utils/formatters";
import { memo } from "react";

interface Props {
  readonly durationMs: number;
  readonly p50Ms?: number;
  readonly p95Ms?: number;
}

const kpiBase = "p-3.5 flex flex-col justify-between min-w-0";
const kpiK = "text-[11px] font-medium text-foreground-caption uppercase tracking-[0.05em]";
const kpiV = "font-mono text-[20px] font-semibold text-foreground tracking-[-0.02em]";

function BaselineBar({ dur, p50, p95 }: { dur: number; p50: number; p95: number }) {
  const max = Math.max(dur, p95 * 1.15);
  const p50Pct = Math.min(100, (p50 / max) * 100);
  const p95Pct = Math.min(100, (p95 / max) * 100);
  const durPct = Math.min(100, (dur / max) * 100);

  return (
    <div className="relative mt-2 h-[5px] w-full rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full bg-primary", dur > p95 && "!bg-error")}
        style={{ width: `${durPct}%` }}
      />
      <div
        className="-translate-x-1/2 absolute top-[-2px] bottom-[-2px] w-[2px] bg-foreground-muted"
        style={{ left: `${p50Pct}%` }}
        title={`p50: ${formatDuration(p50)}`}
      />
      <div
        className="-translate-x-1/2 absolute top-[-2px] bottom-[-2px] w-[2px] bg-warning"
        style={{ left: `${p95Pct}%` }}
        title={`p95: ${formatDuration(p95)}`}
      />
    </div>
  );
}

function DurationKpiCardComponent({ durationMs, p50Ms, p95Ms }: Props) {
  // A baseline over zero spans comes back as zeros; there is nothing to compare to.
  const hasBaseline = p50Ms !== undefined && p95Ms !== undefined && p50Ms > 0 && p95Ms > 0;

  return (
    <div className={cn(kpiBase, "bg-secondary")}>
      <div className={kpiK}>Duration</div>
      <div className={kpiV}>{formatDuration(durationMs)}</div>
      {hasBaseline ? (
        <>
          <div
            className={cn(
              "text-[11.5px] text-foreground-muted",
              durationMs > p95Ms && "text-error"
            )}
          >
            {(durationMs / p50Ms).toFixed(1)}× p50 ·{" "}
            {durationMs > p95Ms ? "above p95" : "below p95"}
          </div>
          <BaselineBar dur={durationMs} p50={p50Ms} p95={p95Ms} />
        </>
      ) : (
        <div className="text-[11.5px] text-foreground-caption">end-to-end wall time</div>
      )}
    </div>
  );
}

export const DurationKpiCard = memo(DurationKpiCardComponent);
