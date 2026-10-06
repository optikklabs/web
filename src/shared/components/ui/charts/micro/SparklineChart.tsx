import { useMemo } from "react";

import { getChartColor } from "@shared/utils/chartTheme";

import UPlotChart from "../UPlotChart";
import { uLine } from "../uplotHelpers";

interface SparklineChartProps {
  data?: number[];
  color?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  calm?: boolean;
}

export default function SparklineChart({
  data = [],
  color = getChartColor(0),
  fill = true,
  width = 60,
  height = 24,
  calm = false,
}: SparklineChartProps) {
  const effectiveFill = calm ? false : fill;
  const effectiveHeight = calm ? Math.min(height, 36) : height;
  const lineWidth = calm ? 1 : 1.5;

  const uplotData = useMemo<uPlot.AlignedData>(() => [data.map((_, i) => i), data], [data]);

  const opts = useMemo<Omit<uPlot.Options, "width" | "height">>(
    () => ({
      axes: [{ show: false }, { show: false }],
      cursor: { show: false },
      legend: { show: false },
      padding: [0, 0, 0, 0],
      series: [{}, uLine("", color, { fill: effectiveFill, width: lineWidth })],
    }),
    [color, effectiveFill, lineWidth]
  );

  if (data.length < 2) return null;

  return (
    <div style={{ width, height: effectiveHeight }}>
      <UPlotChart options={opts} data={uplotData} height={effectiveHeight} />
    </div>
  );
}
