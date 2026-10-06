import { useLocation, useNavigate } from "@tanstack/react-router";

import { Card as Surface } from "@shared/components/primitives/ui/card";
import { buildServiceDrawerSearch } from "@shared/components/ui/drawers/serviceDrawerState";
import { fmtPct, formatNumber } from "@shared/utils/formatters";

import type { ServiceHealthCell, ServiceHealthStatus } from "../hooks/useOverviewModel";

interface Props {
  readonly cells: readonly ServiceHealthCell[];
  readonly limit?: number;
}

// Soft-tinted tile background + matching foreground text (design palette).
const STATUS_TILE: Record<ServiceHealthStatus, string> = {
  ok: "bg-[var(--ok-soft)] text-[var(--ok-fg)]",
  warn: "bg-[var(--warn-soft)] text-[var(--warn-fg)]",
  err: "bg-[var(--err-soft)] text-[var(--err-fg)]",
};

const STATUS_DOT: Record<ServiceHealthStatus, string> = {
  ok: "bg-[var(--ok)]",
  warn: "bg-[var(--warn)]",
  err: "bg-[var(--err)]",
};

function Tile({ cell, onOpen }: { readonly cell: ServiceHealthCell; readonly onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex min-h-[72px] flex-col justify-between rounded-md px-2.5 py-2 text-left transition-opacity hover:opacity-90 ${STATUS_TILE[cell.status]}`}
    >
      <span className="overflow-hidden text-ellipsis whitespace-nowrap font-mono font-semibold text-[11px]">
        {cell.name}
      </span>
      <span className="flex flex-col">
        <span className="font-bold font-mono text-[13px] leading-none">
          {formatNumber(cell.requestCount)}
        </span>
        <span className="font-mono text-[10px] opacity-70">
          {fmtPct(cell.errorRate)} · {Math.round(cell.p99Latency)}ms
        </span>
      </span>
    </button>
  );
}

function StatusLegend({ cells }: { readonly cells: readonly ServiceHealthCell[] }) {
  const counts = cells.reduce(
    (acc, c) => {
      acc[c.status] += 1;
      return acc;
    },
    { ok: 0, warn: 0, err: 0 } as Record<ServiceHealthStatus, number>
  );
  return (
    <div className="flex items-center gap-3 text-[10.5px] text-foreground-muted">
      <span className="flex items-center gap-1">
        <span className={`h-2 w-2 rounded-sm ${STATUS_DOT.ok}`} />
        {counts.ok}
      </span>
      <span className="flex items-center gap-1">
        <span className={`h-2 w-2 rounded-sm ${STATUS_DOT.warn}`} />
        {counts.warn}
      </span>
      <span className="flex items-center gap-1">
        <span className={`h-2 w-2 rounded-sm ${STATUS_DOT.err}`} />
        {counts.err}
      </span>
    </div>
  );
}

export default function ServiceHealthGrid({ cells, limit = 15 }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const visible = cells.slice(0, limit);

  const open = (cell: ServiceHealthCell): void => {
    const search = buildServiceDrawerSearch(location.search, cell.name);
    navigate({ to: location.pathname + search });
  };

  return (
    <Surface elevation={1} padding="md" className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-semibold text-[13px] text-foreground">Service health</div>
          <div className="text-[11px] text-foreground-muted">
            {cells.length} services · click any tile to inspect
          </div>
        </div>
        <StatusLegend cells={cells} />
      </div>

      {visible.length === 0 ? (
        <div className="py-8 text-center text-[12px] text-foreground-muted">
          No services in the selected range
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((cell) => (
            <Tile key={cell.name} cell={cell} onOpen={() => open(cell)} />
          ))}
        </div>
      )}
    </Surface>
  );
}
