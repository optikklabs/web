import type { ColumnDef } from "@tanstack/react-table";

import DataTable from "@shared/components/ui/data-display/DataTable";
import { DrawerSection } from "@shared/components/ui/overlay/detail-drawer/DrawerSection";
import { formatDuration, formatNumber, formatPercentage } from "@shared/utils/formatters";

import type { EndpointRow } from "../types";
import { formatEndpointLabel, formatEndpointMeta } from "../utils";

const ENDPOINT_COLUMNS: ColumnDef<EndpointRow>[] = [
  {
    header: "Method",
    accessorKey: "httpMethod",
    size: 80,
    cell: ({ row: { original: row } }) => (
      <span className="font-medium text-foreground-secondary">{row.httpMethod || "—"}</span>
    ),
  },
  {
    header: "Endpoint Detail",
    id: "operation",
    cell: ({ row: { original: row } }) => {
      const meta = formatEndpointMeta(row);
      return (
        <div className="flex flex-col gap-0.5">
          <span className="break-all">{formatEndpointLabel(row)}</span>
          {meta ? <span className="text-[11px] text-foreground-muted">{meta}</span> : null}
        </div>
      );
    },
  },
  {
    header: "Requests",
    accessorKey: "requestCount",
    size: 90,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => formatNumber(row.requestCount),
  },
  {
    header: "Err %",
    id: "errorRate",
    size: 80,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) =>
      formatPercentage(row.requestCount > 0 ? (row.errorCount * 100) / row.requestCount : 0),
  },
  {
    header: "p50",
    accessorKey: "p50Latency",
    size: 80,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => formatDuration(row.p50Latency),
  },
  {
    header: "p95",
    accessorKey: "p95Latency",
    size: 80,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => formatDuration(row.p95Latency),
  },
];

type Props = {
  isError: boolean;
  isLoading: boolean;
  endpointRows: EndpointRow[];
};

export function ServiceDrawerEndpointsSection({ isError, isLoading, endpointRows }: Props) {
  return (
    <DrawerSection
      title="Top Endpoints"
      action={<span className="text-[11.5px] text-[var(--fg-3)]">by throughput</span>}
    >
      {isError ? (
        <div className="text-[12px] text-foreground-muted">Endpoint breakdown is unavailable.</div>
      ) : (
        <DataTable
          data={{ columns: ENDPOINT_COLUMNS, rows: endpointRows, loading: isLoading }}
          config={{
            emptyText: "No endpoint activity for this service.",
            maxRows: 8,
            rowHeight: 52,
          }}
        />
      )}
    </DrawerSection>
  );
}
