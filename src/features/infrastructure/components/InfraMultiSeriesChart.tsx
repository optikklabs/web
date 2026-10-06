import { memo, useMemo, useState } from "react";

import ObservabilityChart, {
  type ObservabilityChartSeries,
} from "@shared/components/ui/charts/ObservabilityChart";
import ChartNoDataOverlay from "@shared/components/ui/feedback/ChartNoDataOverlay";
import Loading from "@shared/components/ui/feedback/Loading";

import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";
import { tsMs } from "@shared/utils/chartDataUtils";
import { getChartColor } from "@shared/utils/chartTheme";

import { type SeriesPoint, getSeries } from "../api/infrastructureApi";
import InfraSeriesList, { type InfraSeriesListItem } from "./InfraSeriesList";
import { type SeriesFormat, formatSeriesValue } from "./seriesFormat";

/** Shared chart height for every infrastructure metric card. */
const INFRA_CHART_HEIGHT = 220;

/**
 * Series drawn per chart. Infra metrics are unbounded in cardinality (one
 * series per disk, interface, CPU state), so the highest-value series win and
 * the rest are dropped once the chart stops being readable.
 */
const MAX_SERIES = 20;

interface InfraSeries {
  readonly key: string;
  readonly color: string;
  /** One entry per shared timestamp; null where the series has no sample. */
  readonly values: Array<number | null>;
  /** Most recent non-null sample, used for ordering and the list column. */
  readonly latest: number;
}

/**
 * Folds raw rows into a shared timestamp axis plus one series per group. Series
 * are keyed by timestamp rather than positionally: hosts report different
 * sample counts per device, so zipping by index would misalign them.
 */
function buildSeries(rows: readonly SeriesPoint[]): {
  timestamps: number[];
  series: InfraSeries[];
} {
  const pointsByKey = new Map<string, Map<number, number>>();

  for (const row of rows) {
    const key = row.series.trim() || "unknown";
    const ms = tsMs(row.timeBucket);
    const value = Number(row.value);
    if (!Number.isFinite(ms) || !Number.isFinite(value)) continue;

    let points = pointsByKey.get(key);
    if (points === undefined) {
      points = new Map<number, number>();
      pointsByKey.set(key, points);
    }
    points.set(Math.floor(ms / 1000), value);
  }

  const timestamps = [
    ...new Set([...pointsByKey.values()].flatMap((points) => [...points.keys()])),
  ].sort((a, b) => a - b);

  const series = [...pointsByKey.entries()]
    .map(([key, points]) => {
      const values = timestamps.map((ts) => points.get(ts) ?? null);
      const latest = values.findLast((value) => value !== null) ?? 0;
      return { key, values, latest };
    })
    .sort((a, b) => Math.abs(b.latest) - Math.abs(a.latest) || a.key.localeCompare(b.key))
    .slice(0, MAX_SERIES)
    // Colour after ordering so a series keeps its colour when the selection
    // changes — the list swatch and the chart line must never disagree.
    .map((s, idx) => ({ ...s, color: getChartColor(idx) }));

  return { timestamps, series };
}

interface InfraMultiSeriesChartProps {
  readonly queryKey: string;
  readonly endpoint: string;
  readonly title: string;
  readonly height?: number;
  readonly datasetLabel?: string;
  readonly format?: SeriesFormat;
  /** The metric group the series endpoint returns. */
  readonly metric: string;
}

export default memo(function InfraMultiSeriesChart({
  queryKey,
  endpoint,
  title,
  height = INFRA_CHART_HEIGHT,
  datasetLabel = "Value",
  format = "number",
  metric,
}: InfraMultiSeriesChartProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const toggleSeries = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const q = useTimeRangeQuery(`${queryKey}|${metric}`, (start, end) =>
    getSeries(endpoint, metric, start, end)
  );

  // Memoized because this folds every raw sample in the range, unlike the two
  // cheap projections below.
  const { timestamps, series } = useMemo(() => buildSeries(q.data ?? []), [q.data]);

  // Both views are derived from `series`, so a swatch in the list and its line
  // in the chart always share a colour, an order and a value.
  const chartSeries: ObservabilityChartSeries[] = series
    .filter((s) => selectedKeys.length === 0 || selectedKeys.includes(s.key))
    .map((s) => ({ label: s.key, values: s.values, color: s.color, fill: false }));

  const listItems: InfraSeriesListItem[] = series.map((s) => ({
    key: s.key,
    label: s.key,
    value: s.latest,
    color: s.color,
  }));

  const hasData = timestamps.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="font-medium text-[13px] text-foreground">{title}</div>
      <div className="relative shrink-0" style={{ height }}>
        {q.isPending && !hasData ? (
          <div className="flex h-full items-center justify-center">
            <Loading label="" />
          </div>
        ) : hasData ? (
          <ObservabilityChart
            timestamps={timestamps}
            series={chartSeries}
            height={height}
            yMin={0}
            yFormatter={(value) => formatSeriesValue(value, format)}
          />
        ) : (
          <ChartNoDataOverlay />
        )}
      </div>
      <InfraSeriesList
        series={listItems}
        selectedKeys={selectedKeys}
        onToggle={toggleSeries}
        format={format}
        title={datasetLabel}
      />
    </div>
  );
});
