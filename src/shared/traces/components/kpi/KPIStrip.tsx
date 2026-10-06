import type { CriticalPathSpanRecord, TraceRecord } from "@shared/api/traces/schemas";
import { cn } from "@shared/lib/utils";
import { memo, useMemo } from "react";
import { computeMaxDepth, summarizeCriticalPath } from "../../utils/criticalPath";
import { CriticalPathKpiCard } from "./CriticalPathKpiCard";
import { DurationKpiCard } from "./DurationKpiCard";

interface Stats {
  readonly totalSpans: number;
  readonly durationMs: number;
  readonly services: Set<string>;
  readonly errors: number;
}

interface Props {
  readonly stats: Stats;
  readonly spans: readonly TraceRecord[];
  readonly criticalPath: readonly CriticalPathSpanRecord[];
  readonly p50Ms?: number;
  readonly p95Ms?: number;
}

const kpiBase = "p-3.5 flex flex-col justify-between min-w-0 bg-background";
const kpiK = "text-[11px] font-medium text-foreground-caption uppercase tracking-[0.05em]";
const kpiV = "font-mono text-[20px] font-semibold text-foreground tracking-[-0.02em]";

function KPIStripComponent({ stats, spans, criticalPath, p50Ms, p95Ms }: Props) {
  const duration = stats.durationMs;
  const errors = stats.errors;
  const totalSpans = stats.totalSpans;
  const services = stats.services.size;
  const okCount = Math.max(0, totalSpans - errors);

  const maxDepth = computeMaxDepth(spans);

  const critical = useMemo(() => summarizeCriticalPath(criticalPath), [criticalPath]);

  return (
    <div
      className="grid gap-px border-border border-b bg-border"
      style={{
        gridTemplateColumns:
          "minmax(220px, 1.4fr) minmax(110px, 0.7fr) minmax(150px, 0.9fr) minmax(260px, 2fr)",
      }}
    >
      <DurationKpiCard durationMs={duration} p50Ms={p50Ms} p95Ms={p95Ms} />

      <div className={cn(kpiBase, errors > 0 && "bg-error-subtle/20")}>
        <div className={kpiK}>Status</div>
        <div className="flex items-baseline gap-2">
          <span className={cn(kpiV, errors > 0 ? "text-error" : "text-success")}>
            {errors > 0 ? "Error" : "OK"}
          </span>
        </div>
        <div className="text-[11.5px] text-foreground-caption">
          {errors > 0 ? `${errors} errored span${errors === 1 ? "" : "s"}` : `${okCount} spans OK`}
        </div>
      </div>

      <div className={kpiBase}>
        <div className={kpiK}>Spans</div>
        <div className={kpiV}>{totalSpans}</div>
        <div className="text-[11.5px] text-foreground-caption">
          across {services} service{services === 1 ? "" : "s"} · depth {maxDepth}
        </div>
      </div>

      <CriticalPathKpiCard critical={critical} />
    </div>
  );
}

export const KPIStrip = memo(KPIStripComponent);
