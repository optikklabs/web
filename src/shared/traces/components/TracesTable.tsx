import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";

import type { TraceSummary } from "@shared/api/traces/types";
import DataTable from "@shared/components/ui/data-display/DataTable";
import { formatTimestamp } from "@shared/utils/formatters";
import { getServiceColor } from "@shared/utils/serviceColor";

function isErrorTrace(t: TraceSummary): boolean {
  return t.hasError || t.rootStatus?.toUpperCase() === "ERROR";
}

function durationColor(durMs: number): string {
  if (durMs > 1000) return "var(--color-error)";
  if (durMs > 500) return "var(--color-warning)";
  return "var(--text-secondary)";
}

/** Latency bars are scaled against the slowest trace on the page. */
function traceColumns(maxDurMs: number): ColumnDef<TraceSummary>[] {
  return [
    {
      header: "Time",
      accessorKey: "startMs",
      size: 140,
      cell: ({ row: { original: t } }) => (
        <div>
          <div className="truncate whitespace-nowrap font-mono text-[12.5px] text-foreground-secondary">
            {formatTimestamp(t.startMs)}
          </div>
          <div className="font-mono text-[12px] text-foreground-muted">
            {t.traceId.slice(0, 10)}…
          </div>
        </div>
      ),
    },
    {
      header: "Operation",
      accessorKey: "rootOperation",
      cell: ({ row: { original: t } }) => (
        <div className="flex items-center gap-2">
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: getServiceColor(t.rootService) }}
          />
          <div className="min-w-0">
            <div className="truncate font-medium font-mono text-[13px] text-foreground">
              {t.rootOperation || "—"}
            </div>
            <div className="truncate font-mono text-[12px] text-foreground-muted">
              {t.rootService}
              {t.environment ? ` · ${t.environment}` : ""}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Duration",
      accessorKey: "durationMs",
      size: 100,
      meta: { align: "right" },
      cell: ({ row: { original: t } }) => (
        <span
          className="font-mono font-semibold tabular-nums"
          style={{ color: durationColor(t.durationMs) }}
        >
          {t.durationMs >= 1000
            ? `${(t.durationMs / 1000).toFixed(2)} s`
            : `${Math.round(t.durationMs)} ms`}
        </span>
      ),
    },
    {
      header: "Latency bar",
      id: "latencyBar",
      size: 180,
      cell: ({ row: { original: t } }) => (
        <div className="h-2 overflow-hidden rounded-[3px] bg-[var(--bg-inset)]">
          <div
            className="h-full opacity-85"
            style={{
              width: `${Math.min((t.durationMs / maxDurMs) * 100, 100)}%`,
              backgroundColor: getServiceColor(t.rootService),
            }}
          />
        </div>
      ),
    },
    {
      header: "Status",
      id: "status",
      size: 90,
      cell: ({ row: { original: t } }) => {
        const isErr = isErrorTrace(t);
        return (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 font-semibold text-[12px]"
            style={{
              color: isErr ? "var(--color-error)" : "var(--color-success)",
              backgroundColor: isErr ? "var(--color-error-subtle)" : "var(--color-success-subtle)",
            }}
          >
            <span className="mr-1.5 size-1.5 rounded-full bg-current" />
            {t.rootHttpStatus || (isErr ? "ERR" : "OK")}
          </span>
        );
      },
    },
    {
      header: "Spans",
      accessorKey: "spanCount",
      size: 80,
      meta: { align: "right" },
      cell: ({ row: { original: t } }) => (
        <>
          <span className="font-mono text-[13px]">{t.spanCount}</span>
          {t.errorCount > 0 && (
            <span className="ml-1 inline-block rounded-sm bg-error/10 px-1 py-px font-medium text-[11px] text-error">
              {t.errorCount}
            </span>
          )}
        </>
      ),
    },
    {
      header: "",
      id: "chevron",
      size: 36,
      meta: { align: "right" },
      cell: () => <ChevronRight size={14} className="text-foreground-muted" />,
    },
  ];
}

interface TracesTableProps {
  readonly traces: readonly TraceSummary[];
  readonly onRowClick: (trace: TraceSummary) => void;
}

export function TracesTable({ traces, onRowClick }: TracesTableProps): JSX.Element {
  const maxDurMs = traces.reduce((max, t) => Math.max(max, t.durationMs), 1);
  return (
    <DataTable
      data={{ columns: traceColumns(maxDurMs), rows: [...traces] }}
      config={{
        emptyText: "No traces match the current filters.",
        onRow: (trace) => ({
          onClick: () => onRowClick(trace),
          style: { cursor: "pointer" },
        }),
      }}
    />
  );
}
