import type uPlot from "uplot";

import { resolveThemeColor } from "@shared/utils/chartTheme";

import { defaultAxes, formatUniqueAxisValues, uBars, uLine } from "./uplotHelpers";

export interface ObservabilityChartSeries {
  label: string;
  values: Array<number | null>;
  tooltipValues?: Array<number | null>;
  color: string;
  fill?: boolean;
  dash?: number[];
  width?: number;
  showInTooltip?: boolean;
  scale?: string;
}

interface OptionsInput {
  series: ObservabilityChartSeries[];
  type: "line" | "area" | "bar";
  xRange?: [number, number];
  yMin?: number;
  yMax?: number;
  yAxisSize: number;
  legend: boolean;
  plugins: uPlot.Plugin[];
  yFormatter: { current?: (value: number) => string };
}

export function buildChartOptions({
  series,
  type,
  xRange,
  yMin,
  yMax,
  yAxisSize,
  legend,
  plugins,
  yFormatter,
}: OptionsInput): Omit<uPlot.Options, "width" | "height"> {
  const axes = defaultAxes({ yAxisSize });
  axes[1] = {
    ...axes[1],
    values: (_u: uPlot, vals: number[]) => formatUniqueAxisValues(vals, yFormatter.current),
  };
  const scales: uPlot.Scales = {
    x: { time: true, ...(xRange ? { range: xRange } : {}) },
    y: {
      range: (_u, min, max) => [yMin ?? (min < 0 ? min : 0), yMax ?? (max > 0 ? max * 1.1 : 1)],
    },
  };
  const labelColor = resolveThemeColor("--chart-axis", "#b9c0cf");
  for (const item of series) {
    if (item.scale && item.scale !== "y" && item.scale !== "x" && !scales[item.scale]) {
      scales[item.scale] = { min: 0 };
      axes.push({
        scale: item.scale,
        side: 1,
        stroke: resolveThemeColor(item.color, labelColor),
        grid: { show: false },
        ticks: { show: false },
        font: "11px Inter, sans-serif",
        size: yAxisSize,
        gap: 8,
        values: (_u, vals) => formatUniqueAxisValues(vals, yFormatter.current),
      });
    }
  }
  return {
    padding: [10, 16, 6, 4],
    legend: { show: legend },
    axes,
    scales,
    series: [
      {},
      ...series.map((item) => {
        const configured =
          type === "bar"
            ? uBars(item.label, item.color)
            : uLine(item.label, item.color, {
                fill: type === "area" || item.fill,
                dash: item.dash,
                width: item.width ?? 2,
              });
        if (item.scale) configured.scale = item.scale;
        return configured;
      }),
    ],
    ...(plugins.length > 0 ? { plugins } : {}),
  };
}

interface TooltipInput {
  timestamps: { current: number[] };
  series: { current: ObservabilityChartSeries[] };
  xFormatter: { current?: (timestampSeconds: number) => string };
  yFormatter: { current?: (value: number) => string };
}

export function buildTooltipFactory(input: TooltipInput) {
  const defaultXFormatter = (timestampSeconds: number) =>
    new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestampSeconds * 1000));

  return ({ idx }: { u: uPlot; idx: number; data: uPlot.AlignedData }) => {
    const timestampSeconds = input.timestamps.current[idx];
    if (timestampSeconds == null) return null;
    const rows = input.series.current
      .filter((item) => item.showInTooltip !== false)
      .map((item) => {
        const value = (item.tooltipValues ?? item.values)[idx];
        return {
          label: item.label,
          value:
            value == null || Number.isNaN(value)
              ? "—"
              : (input.yFormatter.current?.(value) ?? value.toLocaleString()),
          color: item.color,
        };
      })
      .filter((item) => item.value !== "—");
    return rows.length
      ? { title: (input.xFormatter.current ?? defaultXFormatter)(timestampSeconds), rows }
      : null;
  };
}
