import { useCallback, useMemo } from "react";

import { useAppStore, useResolvedTimeBounds, useTimeRange } from "@app/store/appStore";
import { ExplorerTableFooter } from "@shared/search/components/chrome/ExplorerTableFooter";
import { StatPill } from "@shared/search/components/chrome/StatPill";
import type { ExplorerFilter } from "@shared/search/types/filters";
import { formatNumber } from "@shared/utils/formatters";

import { LogsTable } from "@shared/logs/components/table/LogsTable";
import { LogsTableToolbar } from "@shared/logs/components/table/LogsTableToolbar";
import type { LogRecord } from "@shared/logs/types/log";

import type { useLogsExplorer } from "../hooks/useLogsExplorer";
import { LogDetailDrawer } from "./detail/LogDetailDrawer";
import { LogsTrendChart } from "./trend/LogsTrendChart";

function extractSearchTerm(filters: readonly ExplorerFilter[]): string | undefined {
  const f = filters.find(
    (x) => (x.field === "body" || x.field === "search") && (x.op === "contains" || x.op === "eq")
  );
  return f?.value || undefined;
}

interface LogsExplorerContentProps {
  readonly explorer: ReturnType<typeof useLogsExplorer>;
}

export function LogsExplorerContent({ explorer }: LogsExplorerContentProps) {
  const { state, list, summary, trend } = explorer;
  const timeRange = useTimeRange();
  const { startTime, endTime } = useResolvedTimeBounds();
  const setCustomTimeRange = useAppStore((s) => s.setCustomTimeRange);

  const searchTerm = useMemo(() => extractSearchTerm(state.filters), [state.filters]);
  const onRowClick = useCallback((row: LogRecord) => state.setDetail(row.id), [state]);
  const onTimeRangeChange = useCallback(
    (fromMs: number, toMs: number) => setCustomTimeRange(fromMs, toMs, "Brush"),
    [setCustomTimeRange]
  );

  const results = list.results;
  // Drives the drawer's prev/next arrows within the loaded page.
  const detailIndex = state.detail ? results.findIndex((r) => r.id === state.detail) : -1;
  const prevId = detailIndex > 0 ? results[detailIndex - 1]?.id : undefined;
  const nextId = detailIndex >= 0 ? results[detailIndex + 1]?.id : undefined;
  const closeDetail = useCallback(() => state.setDetail(null), [state]);

  return (
    <>
      <div className="mb-4 flex shrink-0 flex-row items-center gap-2.5">
        <StatPill label="Total" value={formatNumber(summary.data?.total ?? 0)} />
        <StatPill
          label="Errors"
          value={formatNumber(summary.data?.errors ?? 0)}
          dot="var(--color-error)"
        />
        <StatPill
          label="Warnings"
          value={formatNumber(summary.data?.warns ?? 0)}
          dot="var(--color-warning)"
        />
      </div>

      <div className="shrink-0">
        <LogsTrendChart
          trend={trend.data}
          zoomed={timeRange.kind === "absolute"}
          onTimeRangeChange={onTimeRangeChange}
          minTimeMs={startTime}
          maxTimeMs={endTime}
        />
      </div>

      <div className="mt-4 flex flex-col">
        <div className="flex flex-col rounded-[8px] border border-[var(--line)] bg-[var(--bg-1)]">
          <LogsTableToolbar />
          <LogsTable
            rows={results}
            searchTerm={searchTerm}
            loading={list.isPending}
            selectedId={state.detail}
            onRowClick={onRowClick}
          />
          {results.length > 0 || list.hasNextPage || list.hasPrevPage ? (
            <ExplorerTableFooter
              rowCount={results.length}
              noun={results.length === 1 ? "log" : "logs"}
              onPrevPage={list.onPrevPage}
              onNextPage={list.onNextPage}
              hasPrevPage={list.hasPrevPage}
              hasNextPage={list.hasNextPage}
            />
          ) : null}
        </div>
      </div>

      <LogDetailDrawer
        logId={state.detail ?? ""}
        startTime={startTime}
        endTime={endTime}
        open={Boolean(state.detail)}
        onClose={closeDetail}
        onPrev={prevId ? () => state.setDetail(prevId) : undefined}
        onNext={nextId ? () => state.setDetail(nextId) : undefined}
      />
    </>
  );
}
