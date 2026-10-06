import {
  formatDuration as formatMs,
  formatNumber,
  formatPercentage,
} from "@shared/utils/formatters";
import { Handle, type NodeProps, Position } from "@xyflow/react";

import { Tooltip } from "@shared/components/primitives/ui/tooltip";

import type { ServiceTopologyNode as TopologyNode } from "@shared/api/topology";
import { NODE_HEIGHT, NODE_WIDTH } from "./layout";

export type TopologyNodeData = TopologyNode & {
  dimmed: boolean;
  onOpen: (name: string) => void;
};

const healthRingColor: Record<TopologyNode["health"], string> = {
  healthy: "var(--color-success)",
  degraded: "var(--color-warning)",
  unhealthy: "var(--color-error)",
};

export function ServiceTopologyNode({ data }: NodeProps) {
  const d = data as TopologyNodeData;
  const ringColor = healthRingColor[d.health];

  const tooltip = (
    <div className="flex flex-col gap-1 text-[12px]">
      <div className="font-semibold text-foreground">{d.name}</div>
      <div className="flex justify-between gap-4">
        <span className="text-foreground-muted">Requests</span>
        <span>{formatNumber(d.requestCount)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-foreground-muted">Errors</span>
        <span>
          {formatNumber(d.errorCount)} ({formatPercentage(d.errorRate, d.errorRate >= 0.1 ? 1 : 2)})
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-foreground-muted">p50</span>
        <span>{formatMs(d.p50LatencyMs)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-foreground-muted">p95</span>
        <span>{formatMs(d.p95LatencyMs)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-foreground-muted">p99</span>
        <span>{formatMs(d.p99LatencyMs)}</span>
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltip} placement="top">
      <button
        type="button"
        onClick={() => d.onOpen(d.name)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            d.onOpen(d.name);
          }
        }}
        style={{ width: NODE_WIDTH, height: NODE_HEIGHT, opacity: d.dimmed ? 0.25 : 1 }}
        className="group flex cursor-pointer flex-col justify-between rounded-[var(--card-radius)] border border-border bg-muted px-3 py-2 text-left shadow-[var(--shadow-sm)] transition-all hover:border-primary hover:shadow-[var(--shadow-md)]"
      >
        <Handle type="target" position={Position.Left} className="!bg-border" />
        <Handle type="source" position={Position.Right} className="!bg-border" />

        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: ringColor, boxShadow: `0 0 0 3px ${ringColor}22` }}
            aria-hidden
          />
          <span className="truncate font-semibold text-[13px] text-foreground">{d.name}</span>
        </div>

        <div className="grid grid-cols-3 gap-1 text-[11px] leading-tight">
          <div className="flex flex-col">
            <span className="text-foreground-muted">req</span>
            <span className="text-foreground">{formatNumber(d.requestCount)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-foreground-muted">err</span>
            <span
              style={{
                color: d.errorRate > 5 ? "var(--color-error)" : "var(--text-primary)",
              }}
            >
              {formatPercentage(d.errorRate, d.errorRate >= 0.1 ? 1 : 2)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-foreground-muted">p95</span>
            <span className="text-foreground">{formatMs(d.p95LatencyMs)}</span>
          </div>
        </div>
      </button>
    </Tooltip>
  );
}
