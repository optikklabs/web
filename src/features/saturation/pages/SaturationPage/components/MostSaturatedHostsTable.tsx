import { memo } from "react";

import { useNavigate } from "@tanstack/react-router";

import { ROUTES } from "@/shared/constants/routes";
import DataTable from "@shared/components/ui/data-display/DataTable";
import { cn } from "@shared/lib/utils";
import { fmtPct } from "@shared/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";

import type { Host } from "@shared/api/hosts";
import type { Tone } from "../view-models/saturationScore";
import { SaturationCard } from "./SaturationCard";

type Props = {
  rows: Host[];
};

const TONES: Record<string, Tone> = { ok: "ok", warn: "warn", err: "err" };

function toneOf(row: Host): Tone {
  return TONES[row.tone] ?? "ok";
}

function fillToneClass(tone: Tone): string {
  if (tone === "err") return "bg-error";
  if (tone === "warn") return "bg-warning";
  return "bg-success";
}

function rowToneClass(tone: Tone): string {
  if (tone === "err") return "bg-[color-mix(in_oklch,var(--color-error),transparent_94%)]";
  if (tone === "warn") return "bg-[color-mix(in_oklch,var(--color-warning),transparent_94%)]";
  return "";
}

function subsystemLabel(subsystem: string): string {
  return subsystem.charAt(0).toUpperCase() + subsystem.slice(1);
}

function metrics(host: Host): string {
  return `cpu ${fmtPct(host.cpu, 0)} · mem ${fmtPct(host.mem, 0)} · disk ${fmtPct(host.disk, 0)}`;
}

const COLUMNS: ColumnDef<Host>[] = [
  {
    header: "Host",
    accessorKey: "host",
    cell: ({ row: { original: row } }) => (
      <span className="font-mono text-[12.5px] text-foreground">{row.host}</span>
    ),
  },
  {
    header: "System",
    accessorKey: "subsystem",
    cell: ({ row: { original: row } }) => (
      <span className="font-mono text-[12.5px] text-foreground-muted">
        {subsystemLabel(row.subsystem)}
      </span>
    ),
  },
  {
    header: "Metrics",
    id: "metrics",
    cell: ({ row: { original: row } }) => (
      <span className="font-mono text-[12.5px] text-foreground-muted">{metrics(row)}</span>
    ),
  },
  {
    header: "Saturation",
    accessorKey: "saturation",
    size: 160,
    cell: ({ row: { original: row } }) => (
      <div className="relative h-2 min-w-[80px] overflow-hidden rounded bg-[var(--bg-2)]">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-[3px] transition-[width] duration-250",
            fillToneClass(toneOf(row))
          )}
          style={{ width: `${Math.max(0, Math.min(100, row.saturation ?? 0))}%` }}
        />
      </div>
    ),
  },
  {
    header: "%",
    id: "pct",
    size: 56,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => (
      <span className="font-mono text-[12.5px]">{fmtPct(row.saturation, 0)}</span>
    ),
  },
];

function MostSaturatedHostsTableImpl({ rows }: Props): JSX.Element {
  const navigate = useNavigate();

  return (
    <SaturationCard
      title="Most saturated hosts"
      subtitle={`Top ${rows.length} across the fleet · max(cpu, mem, disk)`}
    >
      <DataTable
        data={{ columns: COLUMNS, rows }}
        config={{
          emptyText: "No saturated hosts in this time range.",
          onRow: (row) => ({
            onClick: () =>
              navigate({
                to: ROUTES.hostDetail.replace("$host", encodeURIComponent(row.host)) as never,
              }),
            className: cn("cursor-pointer", rowToneClass(toneOf(row))),
          }),
        }}
      />
    </SaturationCard>
  );
}

export const MostSaturatedHostsTable = memo(MostSaturatedHostsTableImpl);
