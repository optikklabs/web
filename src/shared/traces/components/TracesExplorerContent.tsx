import { useMemo } from "react";

import { ExplorerTableFooter } from "@shared/search/components/chrome/ExplorerTableFooter";
import { StatPill } from "@shared/search/components/chrome/StatPill";
import {
  TrendChart,
  type TrendChartBucket,
  type TrendChartSegment,
} from "@shared/search/components/trend/TrendChart";
import { formatNumber } from "@shared/utils/formatters";

import type { useTracesExplorerModel } from "../hooks/useTracesExplorerModel";
import { TracesTable } from "./TracesTable";

const TRACES_SEGMENTS: readonly TrendChartSegment[] = [
  { key: "ok", label: "OK", color: "var(--ok)" },
  { key: "errors", label: "Errors", color: "var(--err)" },
];

type TracesExplorerModel = ReturnType<typeof useTracesExplorerModel>;

/**
 * Presentational body shared by the standalone Traces explorer and the
 * service-scoped Traces tab: stat pills + trace-volume chart + results table.
 */
export function TracesExplorerContent({ model }: { readonly model: TracesExplorerModel }) {
  const trendData = useMemo<TrendChartBucket[] | undefined>(() => {
    if (!model.trendBuckets || model.trendBuckets.length === 0) return undefined;
    return model.trendBuckets.map((b) => {
      const errors = b.counts.errors || 0;
      return {
        ts: b.ts,
        counts: {
          ok: Math.max(0, b.counts.total - errors),
          errors,
        },
      };
    });
  }, [model.trendBuckets]);

  return (
    <>
      <div className="mb-4 flex shrink-0 flex-row items-center gap-2.5">
        <StatPill label="Total" value={formatNumber(model.summary?.total ?? 0)} />
        <StatPill
          label="Errors"
          value={formatNumber(model.summary?.errors ?? 0)}
          dot="var(--color-error)"
        />
      </div>

      <div className="shrink-0">
        <TrendChart
          title="Trace Volume Over Time"
          segments={TRACES_SEGMENTS}
          data={trendData}
          minTimeMs={model.startTime}
          maxTimeMs={model.endTime}
          onTimeRangeChange={model.onTimeRangeChange}
        />
      </div>

      <div className="mt-4 flex flex-col">
        <TracesTable traces={model.sortedTraces} onRowClick={model.onOpenTrace} />
        <ExplorerTableFooter
          rowCount={model.sortedTraces.length}
          noun={model.sortedTraces.length === 1 ? "trace" : "traces"}
          onNextPage={model.onNextPage}
          onPrevPage={model.onPrevPage}
          hasNextPage={model.hasNextPage}
          hasPrevPage={model.hasPrevPage}
        />
      </div>
    </>
  );
}
