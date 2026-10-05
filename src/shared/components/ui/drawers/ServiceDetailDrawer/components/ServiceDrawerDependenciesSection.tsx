import type { ColumnDef } from "@tanstack/react-table";

import DataTable from "@shared/components/ui/data-display/DataTable";
import { DrawerSection } from "@shared/components/ui/overlay/detail-drawer/DrawerSection";
import { formatDuration, formatNumber } from "@shared/utils/formatters";

import type { DependencyRow } from "../types";

const DEPENDENCY_COLUMNS: ColumnDef<DependencyRow>[] = [
  {
    header: "Service",
    accessorKey: "serviceName",
    cell: ({ row: { original: row } }) => row.serviceName || "Unknown",
  },
  {
    header: "Calls",
    accessorKey: "callCount",
    size: 80,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => formatNumber(row.callCount),
  },
  {
    header: "p95",
    accessorKey: "p95LatencyMs",
    size: 80,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => formatDuration(row.p95LatencyMs),
  },
];

const DEPENDENCY_TABLE_CONFIG = { maxRows: 6, rowHeight: 36 } as const;

type Props = {
  isError: boolean;
  isLoading: boolean;
  upstreamRows: DependencyRow[];
  downstreamRows: DependencyRow[];
};

export function ServiceDrawerDependenciesSection({
  isError,
  isLoading,
  upstreamRows,
  downstreamRows,
}: Props) {
  return (
    <DrawerSection title="Dependencies">
      {isError ? (
        <div className="text-[12px] text-foreground-muted">Dependency map is unavailable.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 font-medium text-[12px] text-foreground-secondary">Upstream</div>
            <DataTable
              data={{ columns: DEPENDENCY_COLUMNS, rows: upstreamRows, loading: isLoading }}
              config={{ ...DEPENDENCY_TABLE_CONFIG, emptyText: "No upstream callers in range." }}
            />
          </div>
          <div>
            <div className="mb-2 font-medium text-[12px] text-foreground-secondary">Downstream</div>
            <DataTable
              data={{ columns: DEPENDENCY_COLUMNS, rows: downstreamRows, loading: isLoading }}
              config={{
                ...DEPENDENCY_TABLE_CONFIG,
                emptyText: "No downstream dependencies in range.",
              }}
            />
          </div>
        </div>
      )}
    </DrawerSection>
  );
}
