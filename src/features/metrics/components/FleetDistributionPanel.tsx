import { useMemo } from "react";

import { PageSurface } from "@shared/components/ui/layout/PageShell";

import type { MetricQueryResult } from "@shared/metrics/types";
import { buildFleetDistribution } from "../utils/fleetDistribution";

interface FleetDistributionPanelProps {
  /** A group-by-host query result; each series is treated as one host. */
  readonly result: MetricQueryResult | undefined;
}

function densityColor(count: number, max: number): string {
  if (count === 0) return "var(--bg-secondary)";
  const intensity = Math.min(count / max, 1);

  const r = Math.round(219 - intensity * (219 - 29));
  const g = Math.round(234 - intensity * (234 - 78));
  const b = Math.round(254 - intensity * (254 - 216));
  return `rgb(${r}, ${g}, ${b})`;
}

type FleetPoint = ReturnType<typeof buildFleetDistribution>["points"][number];

/** Sorted distinct time buckets plus the densest cell count (at least 1). */
function bucketExtent(points: readonly FleetPoint[]): { buckets: number[]; max: number } {
  const seen = new Set<number>();
  let max = 1;
  for (const p of points) {
    seen.add(Number(p.timeBucket));
    max = Math.max(max, p.spanCount ?? 0);
  }
  return { buckets: [...seen].sort((a, b) => a - b), max };
}

export function FleetDistributionPanel({ result }: FleetDistributionPanelProps) {
  const { points, bandLabels } = useMemo(() => buildFleetDistribution(result), [result]);

  const { buckets, max } = bucketExtent(points);

  const countAt = (band: string, bucket: number): number =>
    points.find((p) => p.latencyBucket === band && Number(p.timeBucket) === bucket)?.spanCount ?? 0;

  const displayBands = [...bandLabels].reverse();

  return (
    <PageSurface padding="lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-[15px] text-foreground tracking-[0.01em]">
            Distribution across fleet
          </div>
          <div className="mt-0.5 text-[12px] text-foreground-muted">
            p95 latency · binned per bucket · color = host density
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-foreground-muted">0</span>
          <span
            className="h-2 w-[90px] rounded-[2px]"
            style={{
              background: "linear-gradient(90deg,#dbeafe,#bfdbfe,#93c5fd,#60a5fa,#3b82f6,#1d4ed8)",
            }}
          />
          <span className="text-[11px] text-foreground-muted">{max}+ hosts</span>
        </div>
      </div>

      {buckets.length === 0 ? (
        <div className="py-12 text-center text-[12px] text-foreground-muted">
          No fleet data — group a query by host to populate the distribution.
        </div>
      ) : (
        <div className="mt-3.5 flex flex-col gap-0.5">
          {displayBands.map((band) => (
            <div key={band} className="flex items-center gap-1">
              <div className="w-[72px] min-w-[72px] whitespace-nowrap pr-2 text-right text-[10.5px] text-foreground-muted">
                {band}
              </div>
              <div className="flex flex-1 gap-px">
                {buckets.map((bucket) => {
                  const count = countAt(band, bucket);
                  return (
                    <div
                      key={bucket}
                      title={`${band} · ${count} host${count === 1 ? "" : "s"}`}
                      className="h-5 flex-1 rounded-[2px]"
                      style={{ background: densityColor(count, max) }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10.5px] text-foreground-muted">
              earliest ──────── now
            </span>
          </div>
        </div>
      )}
    </PageSurface>
  );
}
