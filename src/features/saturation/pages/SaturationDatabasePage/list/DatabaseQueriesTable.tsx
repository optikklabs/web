import { ChevronRight } from "lucide-react";

import type { SlowQueryPatternRow } from "@/features/saturation/api/databaseSlowQueriesApi";
import DataTable from "@shared/components/ui/data-display/DataTable";
import { StatusDot } from "@shared/components/ui/data-display/status/StatusDot";
import { fmtMs, fmtNum } from "@shared/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";

import { INSTANCE_HEALTH } from "../databaseInstanceModel";

const P99_WARN_MS = 1000;
const P99_CRIT_MS = 2000;

function queryStatus(p99: number) {
  if (p99 >= P99_CRIT_MS) return INSTANCE_HEALTH.err;
  if (p99 >= P99_WARN_MS) return INSTANCE_HEALTH.warn;
  return INSTANCE_HEALTH.ok;
}

const COLUMNS: ColumnDef<SlowQueryPatternRow>[] = [
  {
    header: "Query",
    accessorKey: "queryText",
    size: 420,
    minSize: 180,
    cell: ({ row: { original: row } }) => (
      <div className="flex min-w-0 items-center gap-2">
        <StatusDot status={queryStatus(row.p99Ms)} />
        <span className="block truncate font-mono text-[11.5px] text-foreground">
          {row.queryText || "—"}
        </span>
      </div>
    ),
  },
  {
    header: "System",
    accessorKey: "dbSystem",
    size: 110,
    cell: ({ row: { original: row } }) => <span className="font-mono">{row.dbSystem || "—"}</span>,
  },
  {
    header: "Database",
    accessorKey: "collectionName",
    size: 140,
    cell: ({ row: { original: row } }) => (
      <span className="block truncate font-mono">{row.collectionName || "—"}</span>
    ),
  },
  {
    header: "Calls",
    accessorKey: "callCount",
    size: 90,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => (
      <span className="font-mono">{fmtNum(row.callCount)}</span>
    ),
  },
  {
    header: "Errors",
    accessorKey: "errorCount",
    size: 90,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => (
      <span className="font-mono">{fmtNum(row.errorCount)}</span>
    ),
  },
  {
    header: "p95",
    accessorKey: "p95Ms",
    size: 84,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => <span className="font-mono">{fmtMs(row.p95Ms)}</span>,
  },
  {
    header: "p99",
    accessorKey: "p99Ms",
    size: 84,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => <span className="font-mono">{fmtMs(row.p99Ms)}</span>,
  },
  {
    header: "",
    id: "chevron",
    size: 34,
    cell: () => <ChevronRight size={14} className="text-foreground-muted" />,
  },
];

interface DatabaseQueriesTableProps {
  readonly rows: readonly SlowQueryPatternRow[];
  readonly loading: boolean;
  readonly emptyText?: string;
  readonly onOpen: (row: SlowQueryPatternRow) => void;
}

export function DatabaseQueriesTable({
  rows,
  loading,
  emptyText = "No queries match the current filters.",
  onOpen,
}: DatabaseQueriesTableProps) {
  return (
    <DataTable
      data={{ columns: COLUMNS, rows: [...rows], loading }}
      resize={{ storageKey: "database.queries" }}
      pagination={{ showPagination: false }}
      config={{
        emptyText,
        onRow: (row) => ({
          onClick: () => onOpen(row),
          style: { cursor: "pointer" },
        }),
      }}
    />
  );
}
