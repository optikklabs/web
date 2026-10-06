import { cn } from "@shared/lib/utils";
import { formatDuration } from "@shared/utils/formatters";
import { AlertTriangle, Zap } from "lucide-react";
import { memo } from "react";
import type { CriticalPathSummary } from "../../utils/criticalPath";

interface Props {
  readonly critical: CriticalPathSummary;
}

const kpiBase = "p-3.5 flex flex-col justify-between min-w-0 bg-background";
const kpiK = "text-[11px] font-medium text-foreground-caption uppercase tracking-[0.05em]";

/** A single span owning this much of the critical path is flagged as the bottleneck. */
const BOTTLENECK_SHARE_PCT = 80;

function CriticalPathKpiCardComponent({ critical }: Props) {
  const { top } = critical;
  const isHeavy = top !== null && top.sharePct >= BOTTLENECK_SHARE_PCT;

  return (
    <div className={cn(kpiBase, isHeavy && "bg-degraded-subtle/30")}>
      <div className="flex items-center justify-between">
        <div className={kpiK}>Critical Path</div>
        {isHeavy ? (
          <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-degraded">
            <AlertTriangle size={11} /> High Bottleneck
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-foreground-caption">
            <Zap size={11} /> Path
          </span>
        )}
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono font-semibold text-[20px] text-foreground tracking-[-0.02em]">
          {top === null ? "—" : `${top.sharePct}%`}
        </span>
        <span className="text-[12px] text-foreground-muted">
          of {formatDuration(critical.durationMs)} path across {critical.spanCount} spans
        </span>
      </div>

      <div className="mt-1 truncate text-[11.5px] text-foreground-caption">
        {top === null ? "No critical path" : `in ${top.name} (${formatDuration(top.selfMs)})`}
      </div>
    </div>
  );
}

export const CriticalPathKpiCard = memo(CriticalPathKpiCardComponent);
