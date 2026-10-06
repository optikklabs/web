import { ChevronRight } from "lucide-react";

import DataTable from "@shared/components/ui/data-display/DataTable";
import { formatNumber, formatRelativeTime } from "@shared/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";

import type { ErrorGroup } from "@shared/api/errors";

/** Recent (seconds-ago) last-seen values render in the error color to signal "still firing". */
function isFreshlySeen(iso: string): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 60_000;
}

const columns: ColumnDef<ErrorGroup>[] = [
  {
    header: "Issue",
    accessorKey: "operationName",
    cell: ({ row: { original: row } }) => (
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-error" />
        <div className="min-w-0">
          <span className="font-mono font-semibold text-[13px] text-foreground">
            {row.operationName || "—"}
          </span>
          {row.statusMessage ? (
            <div className="mt-0.5 max-w-[460px] truncate text-[12px] text-foreground-muted">
              {row.statusMessage}
            </div>
          ) : null}
          <div className="mt-1 font-mono text-[11.5px] text-primary">{row.serviceName}</div>
        </div>
      </div>
    ),
  },
  {
    header: "HTTP",
    accessorKey: "httpStatusCode",
    size: 80,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => (
      <span className="font-mono text-[12.5px] text-foreground-secondary">
        {row.httpStatusCode ?? "—"}
      </span>
    ),
  },
  {
    header: "Errors",
    accessorKey: "errorCount",
    size: 100,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => (
      <span className="font-mono font-semibold text-[13px] text-foreground tabular-nums">
        {formatNumber(row.errorCount)}
      </span>
    ),
  },
  {
    header: "First seen",
    accessorKey: "firstOccurrence",
    size: 110,
    cell: ({ row: { original: row } }) => (
      <span className="font-mono text-[12.5px] text-foreground-muted">
        {row.firstOccurrence ? formatRelativeTime(row.firstOccurrence) : "—"}
      </span>
    ),
  },
  {
    header: "Last seen",
    accessorKey: "lastOccurrence",
    size: 100,
    cell: ({ row: { original: row } }) => (
      <span
        className={`font-mono text-[12.5px] ${
          isFreshlySeen(row.lastOccurrence) ? "text-error" : "text-foreground-secondary"
        }`}
      >
        {row.lastOccurrence ? formatRelativeTime(row.lastOccurrence) : "—"}
      </span>
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

interface IssuesTableProps {
  readonly rows: readonly ErrorGroup[];
  readonly onOpen: (groupId: string) => void;
}

export function IssuesTable({ rows, onOpen }: IssuesTableProps): JSX.Element {
  return (
    <DataTable
      data={{ columns, rows: [...rows] }}
      config={{
        onRow: (record) => ({
          onClick: () => onOpen(record.groupId),
          style: { cursor: "pointer" },
        }),
      }}
    />
  );
}
