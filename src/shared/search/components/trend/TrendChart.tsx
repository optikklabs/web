import ObservabilityChart, {
  type ObservabilityChartSeries,
} from "@shared/components/ui/charts/ObservabilityChart";
import { memo, useMemo } from "react";

export interface TrendChartSegment {
  key: string;
  label: string;
  color: string;
}

export interface TrendChartBucket {
  ts: number;
  counts: Record<string, number>;
}

interface TrendChartProps {
  title: string;
  segments: readonly TrendChartSegment[]; // Ordered visually from bottom to top of the stack
  data: readonly TrendChartBucket[] | undefined;
  minTimeMs?: number;
  maxTimeMs?: number;
  onTimeRangeChange?: (fromMs: number, toMs: number) => void;
}

function compactY(v: number): string {
  if (v === 0) return "0";
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(v);
}

function TrendChartComponent({
  title,
  segments,
  data,
  minTimeMs,
  maxTimeMs,
  onTimeRangeChange,
}: TrendChartProps) {
  const { timestamps, series } = useMemo(() => {
    if (!data || data.length === 0) return { timestamps: null, series: [] };

    // Stack the segments bottom to top, then draw the outermost band (which
    // encompasses all counts) first so the inner bands paint over it.
    let below = data.map(() => 0);
    const stacked = segments.map((seg): ObservabilityChartSeries => {
      const counts = data.map((b) => b.counts[seg.key] ?? 0);
      below = below.map((v, i) => v + (counts[i] ?? 0));
      return {
        label: seg.label,
        values: below,
        tooltipValues: counts,
        color: seg.color,
        fill: true,
      };
    });

    return { timestamps: data.map((b) => b.ts / 1000), series: stacked.reverse() };
  }, [data, segments]);

  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--bg-1)] pt-[14px] pr-[18px] pb-2 pl-[18px]">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-[var(--fg-0)] text-sm">{title}</span>
        <div className="flex gap-4">
          {segments.map((seg) => (
            <span
              key={seg.key}
              className="inline-flex items-center gap-1.5 text-[var(--fg-2)] text-xs"
            >
              <i className="h-[7px] w-[7px] rounded-full" style={{ background: seg.color }} />
              {seg.label}
            </span>
          ))}
        </div>
      </div>

      <div className="h-[180px] w-full">
        {!timestamps ? (
          <div className="flex h-full items-center justify-center text-[var(--fg-3)] text-sm">
            —
          </div>
        ) : (
          <ObservabilityChart
            type="bar"
            timestamps={timestamps}
            series={series}
            yFormatter={compactY}
            xMin={minTimeMs ? minTimeMs / 1000 : undefined}
            xMax={maxTimeMs ? maxTimeMs / 1000 : undefined}
            onTimeBrush={onTimeRangeChange}
            yAxisSize={40}
            fillHeight
          />
        )}
      </div>
    </div>
  );
}

export const TrendChart = memo(TrendChartComponent);
