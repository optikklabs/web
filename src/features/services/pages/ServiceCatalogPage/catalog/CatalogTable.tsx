import { ChevronRight } from "lucide-react";

import DataTable from "@shared/components/ui/data-display/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

import { SparklineCell } from "@shared/components/ui/charts/micro/SparklineCell";
import { StatusDot } from "@shared/components/ui/data-display/status/StatusDot";
import { fmtMs, fmtNum, fmtPct } from "@shared/utils/formatters";
import { ServiceAvatar } from "../../../components/ServiceAvatar";
import type { CatalogRow } from "./buildCatalogRows";

function ErrorCell({ rate }: { rate: number }) {
  const tone = rate >= 2 ? "text-error" : rate >= 0.5 ? "text-warning" : "text-foreground";
  return <span className={tone}>{fmtPct(rate, rate < 0.1 ? 3 : 2)}</span>;
}

function NameCell({ row }: { row: CatalogRow }) {
  const metadata = [
    row.version,
    row.environment,
    row.instances > 0 ? `${row.instances} inst` : "",
  ].filter((value) => value !== "");
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <StatusDot status={row.status} ring className="h-2 w-2" />
      <ServiceAvatar serviceName={row.serviceName} size={26} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-semibold text-[12.5px] text-foreground">
          {row.serviceName}
        </span>
        <span className="truncate font-mono text-[11px] text-foreground-muted">
          {metadata.length > 0 ? metadata.join(" · ") : "Metadata unavailable"}
        </span>
      </div>
    </div>
  );
}

function sparkTone(status: CatalogRow["status"]): "info" | "warn" | "err" {
  return status === "error" ? "err" : status === "warn" ? "warn" : "info";
}

const COLUMNS: ColumnDef<CatalogRow>[] = [
  {
    header: "Service",
    accessorKey: "serviceName",
    size: 300,
    cell: ({ row: { original: row } }) => <NameCell row={row} />,
  },
  {
    header: "RPS",
    accessorKey: "rps",
    size: 110,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => (
      <span className="font-semibold text-[12.5px] text-foreground tabular-nums">
        {fmtNum(row.rps)}
      </span>
    ),
  },
  {
    header: "Error",
    accessorKey: "errorRate",
    size: 90,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => (
      <span className="tabular-nums">
        <ErrorCell rate={row.errorRate} />
      </span>
    ),
  },
  {
    header: "P99",
    accessorKey: "p99Ms",
    size: 100,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => (
      <span className="font-mono text-[12px] tabular-nums">{fmtMs(row.p99Ms)}</span>
    ),
  },
  {
    header: "Last 1 hour",
    accessorKey: "sparkline",
    size: 140,
    cell: ({ row: { original: row } }) => (
      <SparklineCell values={row.sparkline} tone={sparkTone(row.status)} width={120} />
    ),
  },
  {
    header: "",
    id: "chevron",
    size: 40,
    meta: { align: "right" },
    cell: () => <ChevronRight size={14} className="text-foreground-muted" />,
  },
];

interface CatalogTableProps {
  readonly rows: CatalogRow[];
  readonly loading?: boolean;
  readonly onRowClick: (serviceName: string) => void;
}

export function CatalogTable({ rows, loading, onRowClick }: CatalogTableProps) {
  return (
    <DataTable
      data={{
        columns: COLUMNS,
        rows,
        loading,
      }}
      pagination={{ pageSize: 50 }}
      config={{
        emptyText: "No services match the current filters.",
        onRow: (record) => ({
          onClick: () => onRowClick(record.serviceName),
          style: { cursor: "pointer" },
        }),
      }}
    />
  );
}
