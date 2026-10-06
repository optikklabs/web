import { resolveThemeColor } from "@shared/utils/chartTheme";
import uPlot from "uplot";

/** Default axis styling matching the app's dark theme. */
export function defaultAxes(config?: { yAxisSize?: number }): uPlot.Axis[] {
  const gridColor = resolveThemeColor("--chart-grid", "rgba(255,255,255,0.10)");
  const labelColor = resolveThemeColor("--chart-axis", "#b9c0cf");
  const font = "11px Inter, sans-serif";
  const yAxisSize = config?.yAxisSize ?? 44;

  return [
    {
      stroke: labelColor,
      grid: { stroke: gridColor, width: 1 },
      ticks: { show: false },
      font,
      gap: 8,
      values: (u: uPlot, splits: number[]) => {
        const minTs = u.scales.x?.min ?? splits[0] ?? 0;
        const maxTs = u.scales.x?.max ?? splits.at(-1) ?? 0;
        const rangeS = maxTs - minTs;

        return splits.map((ts, idx) => {
          const d = new Date(ts * 1000);

          if (rangeS <= 3600) {
            return d.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            });
          }

          if (rangeS <= 86400) {
            const time = d.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
            if (idx === 0) {
              const date = d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
              return `${date} ${time}`;
            }
            return time;
          }

          if (rangeS <= 3 * 86400) {
            return d.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
          }

          if (rangeS <= 14 * 86400) {
            return d.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
          }

          return d.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
        });
      },
    },
    {
      stroke: labelColor,
      grid: { stroke: gridColor, width: 1 },
      ticks: { show: false },
      font,
      size: yAxisSize,
      gap: 8,
    },
  ];
}

/** Formats axis tick numbers and suppresses duplicate consecutive/identical formatted labels. */
export function formatUniqueAxisValues(
  vals: number[],
  formatter?: (val: number) => string
): string[] {
  const seen = new Set<string>();
  return vals.map((v) => {
    const formatted = formatter ? formatter(v) : String(v);
    if (!formatted || seen.has(formatted)) {
      return "";
    }
    seen.add(formatted);
    return formatted;
  });
}

export function uLine(
  label: string,
  color: string,
  opts?: { fill?: boolean; dash?: number[]; width?: number; fillAlphaHex?: string }
): uPlot.Series {
  const alpha = opts?.fillAlphaHex ?? "2E";
  const resolvedColor = resolveThemeColor(color, "#ffffff");
  return {
    label,
    stroke: resolvedColor,
    width: opts?.width ?? 2,
    fill: opts?.fill ? `${resolvedColor}${alpha}` : undefined,
    dash: opts?.dash,
    points: { show: false },
  };
}

export function uBars(label: string, color: string): uPlot.Series {
  const resolvedColor = resolveThemeColor(color, "#ffffff");
  return {
    label,
    stroke: resolvedColor,
    fill: `${resolvedColor}DD`,
    points: { show: false },
    paths: uPlot.paths.bars?.({ size: [0.6] }),
  };
}

export interface ThresholdLine {
  value: number;
  /** Theme token (e.g. "var(--color-warning)") or literal color. */
  color: string;
  dash?: number[];
}

/** Draws horizontal reference lines (warn/alert thresholds) across the plot. */
export function thresholdLinesPlugin(thresholds: ThresholdLine[]): uPlot.Plugin {
  const lines = thresholds.map((t) => ({
    value: t.value,
    color: resolveThemeColor(t.color, "#ffffff"),
    dash: t.dash ?? [4, 4],
  }));
  return {
    hooks: {
      draw: (u) => {
        const { ctx } = u;
        const xMin = u.bbox.left;
        const xMax = xMin + u.bbox.width;
        for (const line of lines) {
          const y = u.valToPos(line.value, "y", true);
          if (y < u.bbox.top || y > u.bbox.top + u.bbox.height) continue;
          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = line.color;
          ctx.lineWidth = 1;
          ctx.setLineDash(line.dash);
          ctx.moveTo(xMin, y);
          ctx.lineTo(xMax, y);
          ctx.stroke();
          ctx.restore();
        }
      },
    },
  };
}
