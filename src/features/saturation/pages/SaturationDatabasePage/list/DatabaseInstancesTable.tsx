import { useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import SparklineChart from "@shared/components/ui/charts/micro/SparklineChart";
import DataTable from "@shared/components/ui/data-display/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

import type { DatastoreSystemRow } from "@/features/saturation/api/datastoresExplorerSchemas";
import { ROUTES } from "@/shared/constants/routes";
import { fmtMs, fmtNum } from "@shared/utils/formatters";

import { StatusPill } from "@shared/components/ui/data-display/status/StatusPill";

import { DbEngineIcon } from "../components/DbEngineIcon";
import {
  INSTANCE_HEALTH,
  STATUS_LABEL,
  engineColor,
  instanceStatus,
} from "../databaseInstanceModel";

const P95_WARN_MS = 1000;
const P95_CRIT_MS = 2000;

function p95Class(ms: number): string {
  if (ms >= P95_CRIT_MS) return "text-error";
  if (ms >= P95_WARN_MS) return "text-warning";
  return "text-foreground";
}

function buildColumns(sparklines: Map<string, number[]>): ColumnDef<DatastoreSystemRow>[] {
  return [
    {
      header: "Instance",
      accessorKey: "system",
      size: 260,
      cell: ({ row: { original: row } }) => (
        <div className="flex items-center gap-2.5">
          <DbEngineIcon system={row.system} />
          <div className="min-w-0">
            <div className="truncate font-mono font-semibold text-[12.5px] text-foreground">
              {row.system}
            </div>
            <div className="truncate font-mono text-[11px] text-foreground-muted">
              {row.category}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Region",
      accessorKey: "region",
      size: 150,
      cell: ({ row: { original: row } }) => (
        <span className="font-mono text-[12px] text-foreground-secondary">{row.region || "—"}</span>
      ),
    },
    {
      header: "Queries",
      accessorKey: "queryCount",
      size: 100,
      meta: { align: "right" },
      cell: ({ row: { original: row } }) => (
        <span className="font-mono font-semibold text-foreground">{fmtNum(row.queryCount)}</span>
      ),
    },
    {
      header: "Trend",
      accessorKey: "trend",
      size: 110,
      cell: ({ row: { original: row } }) => {
        const series = sparklines.get(row.system) ?? [];
        const status = instanceStatus(row);
        const color =
          status === "err"
            ? "var(--color-error)"
            : status === "warn"
              ? "var(--color-warning)"
              : engineColor(row.system);
        return <SparklineChart data={series} color={color} width={96} height={24} />;
      },
    },
    {
      header: "Avg",
      accessorKey: "avgLatencyMs",
      size: 84,
      meta: { align: "right" },
      cell: ({ row: { original: row } }) => (
        <span className="font-mono">{fmtMs(row.avgLatencyMs)}</span>
      ),
    },
    {
      header: "p95",
      accessorKey: "p95LatencyMs",
      size: 84,
      meta: { align: "right" },
      cell: ({ row: { original: row } }) => (
        <span className={`font-mono ${p95Class(row.p95LatencyMs)}`}>{fmtMs(row.p95LatencyMs)}</span>
      ),
    },
    {
      header: "Connections",
      accessorKey: "activeConnections",
      size: 110,
      meta: { align: "right" },
      cell: ({ row: { original: row } }) => (
        <span className="font-mono">{fmtNum(row.activeConnections)}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      size: 120,
      cell: ({ row: { original: row } }) => {
        const s = instanceStatus(row);
        return <StatusPill status={INSTANCE_HEALTH[s]} label={STATUS_LABEL[s]} />;
      },
    },
    {
      header: "",
      id: "chevron",
      size: 34,
      cell: () => <ChevronRight size={14} className="text-foreground-muted" />,
    },
  ];
}

interface DatabaseInstancesTableProps {
  readonly rows: DatastoreSystemRow[];
  readonly loading: boolean;
  readonly sparklines: Map<string, number[]>;
}

export function DatabaseInstancesTable({ rows, loading, sparklines }: DatabaseInstancesTableProps) {
  const navigate = useNavigate();
  const columns = buildColumns(sparklines);
  return (
    <DataTable
      data={{ columns, rows, loading }}
      pagination={{ showPagination: false }}
      config={{
        emptyText: "No datastore instances match the current filters.",
        onRow: (row) => ({
          onClick: () =>
            navigate({
              to: ROUTES.databaseInstance.replace(
                "$system",
                encodeURIComponent(row.system)
              ) as never,
            }),
          style: { cursor: "pointer" },
        }),
      }}
    />
  );
}
