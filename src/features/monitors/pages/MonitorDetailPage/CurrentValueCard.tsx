import { memo } from "react";

import type { Monitor, MonitorStatus } from "../../api/monitorsApi";

interface Props {
  readonly monitor: Monitor;
}

/**
 * Per-status styling. `fill` is the bar width used when no ratio to the alert
 * threshold can be computed, so a firing monitor never shows an empty bar.
 */
const STATUS_STYLE: Record<MonitorStatus, { text: string; bar: string; fill: number }> = {
  alert: { text: "text-error", bar: "bg-error", fill: 100 },
  warn: { text: "text-warning", bar: "bg-warning", fill: 66 },
  ok: { text: "text-success", bar: "bg-success", fill: 0 },
  no_data: { text: "text-foreground-secondary", bar: "bg-success", fill: 0 },
};

function CurrentValueCard({ monitor }: Props) {
  const value = monitor.currentValue;
  const alert = monitor.conditions.alertThreshold;
  const warn = monitor.conditions.warnThreshold;
  const style = STATUS_STYLE[monitor.status];
  // Ratio is only meaningful with a non-zero threshold; avoid divide-by-zero.
  const ratio =
    value !== undefined && alert !== undefined && alert !== 0 ? value / alert : undefined;
  const barWidth = ratio !== undefined ? Math.min(100, Math.max(0, (ratio / 2) * 100)) : style.fill;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="font-medium text-foreground text-sm">Current value</div>
      <div className="text-[11px] text-foreground-muted">vs alert threshold</div>
      <div className="mt-4">
        <div className={`font-semibold text-4xl ${style.text}`}>
          {value !== undefined ? value.toFixed(2) : "—"}
        </div>
        {ratio !== undefined && (
          <div className="mt-1 text-[11px] text-foreground-muted">
            {ratio.toFixed(1)}× the alert threshold ({alert})
          </div>
        )}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded bg-secondary">
        <div className={`h-full ${style.bar}`} style={{ width: `${barWidth}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-foreground-muted">
        <span>0</span>
        <span>warn {warn ?? "—"}</span>
        <span>alert {alert ?? "—"}</span>
      </div>
    </div>
  );
}

export default memo(CurrentValueCard);
