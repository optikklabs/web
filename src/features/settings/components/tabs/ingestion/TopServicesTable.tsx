import SparklineChart from "@shared/components/ui/charts/micro/SparklineChart";
import DataTable from "@shared/components/ui/data-display/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

import { PanelCard } from "@shared/components/ui/PanelCard";
import { pickCyclic } from "@shared/utils/cyclic";

import type { IngestionServiceRow, IngestionServices } from "@shared/api/ingestion";
import { type IngestionUnit, SERVICE_PALETTE, SIGNAL_COLORS, fmtCount, fmtValue } from "./format";

interface Props {
  readonly data: IngestionServices | undefined;
  readonly isPending: boolean;
  readonly unit: IngestionUnit;
}

function MixBar({ row }: { row: IngestionServiceRow }) {
  const parts = [
    { label: "Logs", v: row.logs, color: SIGNAL_COLORS.logs },
    { label: "Spans", v: row.spans, color: SIGNAL_COLORS.spans },
    { label: "Timeseries", v: row.timeseries, color: SIGNAL_COLORS.metrics },
  ];
  const total = parts.reduce((a, p) => a + p.v, 0) || 1;
  return (
    <div
      className="flex h-2 w-full gap-0.5"
      title={parts.map((p) => `${p.label}: ${fmtCount(p.v)}`).join(" · ")}
    >
      {parts.map((p) => (
        <div
          key={p.label}
          className="h-full rounded-sm"
          style={{ width: `${(p.v / total) * 100}%`, background: p.color }}
        />
      ))}
    </div>
  );
}

// Delta is record-based; up (more ingest, more spend) reads as caution.
function Delta({ pct }: { pct: number }) {
  if (Math.abs(pct) < 0.5) return <span className="text-foreground-muted">·</span>;
  const up = pct > 0;
  return (
    <span className={up ? "text-error" : "text-success"}>
      {up ? "▲" : "▼"} {up ? "+" : ""}
      {pct.toFixed(0)}%
    </span>
  );
}

function paletteColor(index: number): string {
  return pickCyclic(SERVICE_PALETTE, index);
}

function buildColumns(unit: IngestionUnit): ColumnDef<IngestionServiceRow>[] {
  const bytes = unit === "bytes";
  return [
    {
      header: "Service",
      accessorKey: "name",
      size: 220,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <span
            className="h-2 w-2 shrink-0 rounded-sm"
            style={{ background: paletteColor(row.index) }}
          />
          <div>
            <div className="mono font-medium text-[13px] text-foreground">{row.original.name}</div>
            {row.original.env && (
              <div className="mono text-[11.5px] text-foreground-muted">env:{row.original.env}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Mix",
      id: "mix",
      size: 140,
      cell: ({ row: { original: s } }) => <MixBar row={s} />,
    },
    {
      header: "Logs",
      accessorKey: "logs",
      meta: { align: "right" },
      cell: ({ row: { original: s } }) => <span className="mono">{fmtCount(s.logs)}</span>,
    },
    {
      header: "Spans",
      accessorKey: "spans",
      meta: { align: "right" },
      cell: ({ row: { original: s } }) => <span className="mono">{fmtCount(s.spans)}</span>,
    },
    {
      header: "Timeseries",
      accessorKey: "timeseries",
      meta: { align: "right" },
      cell: ({ row: { original: s } }) => (
        <span className="mono text-foreground-secondary">{fmtCount(s.timeseries)}</span>
      ),
    },
    {
      header: bytes ? "Volume" : "Total",
      id: "total",
      meta: { align: "right" },
      cell: ({ row: { original: s } }) => (
        <span className="mono font-semibold text-foreground">
          {fmtValue(unit, bytes ? s.bytes : s.total)}
        </span>
      ),
    },
    {
      header: "%",
      id: "pct",
      size: 56,
      meta: { align: "right" },
      cell: ({ row: { original: s } }) => (
        <span className="mono text-foreground-secondary">
          {(bytes ? s.bytesPct : s.pct).toFixed(1)}%
        </span>
      ),
    },
    {
      header: "Trend",
      id: "trend",
      size: 130,
      cell: ({ row }) => (
        <SparklineChart
          data={[...(bytes ? row.original.byteSpark : row.original.spark)]}
          color={paletteColor(row.index)}
          width={120}
          height={24}
        />
      ),
    },
    {
      header: "Δ",
      id: "delta",
      size: 64,
      meta: { align: "right" },
      cell: ({ row: { original: s } }) => (
        <span className="mono font-medium">
          <Delta pct={s.deltaPct} />
        </span>
      ),
    },
  ];
}

export function TopServicesTable({ data, isPending, unit }: Props) {
  const bytes = unit === "bytes";
  const services = data?.services ?? [];
  const topShare = bytes ? data?.topShareBytesPct : data?.topSharePct;
  const footer = data
    ? `Showing top ${services.length} of ${data.totalServices} services · top ${services.length} account for ${Math.round(topShare ?? 0)}% of ingest`
    : "";

  return (
    <PanelCard
      title="Top ingesting services"
      subtitle="volume by service across all telemetry · this period"
      padded={false}
    >
      <DataTable
        data={{ columns: buildColumns(unit), rows: [...services], loading: isPending }}
        config={{ emptyText: "No service ingestion in this period." }}
      />
      {services.length > 0 && (
        <div className="border-border border-t bg-secondary px-4 py-2.5 text-[12.5px] text-foreground-muted">
          {footer}
        </div>
      )}
    </PanelCard>
  );
}
