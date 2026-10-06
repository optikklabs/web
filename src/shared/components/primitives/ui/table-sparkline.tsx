import SparklineChart from "@shared/components/ui/charts/micro/SparklineChart";

import { cn } from "@shared/lib/utils";

export interface TableSparklineProps {
  readonly data: readonly number[];
  readonly width?: number;
  readonly height?: number;
  readonly trend?: "up" | "down" | "flat";
  readonly className?: string;
}

const TREND_TO_COLOR: Record<NonNullable<TableSparklineProps["trend"]>, string> = {
  up: "var(--color-success)",
  down: "var(--color-error)",
  flat: "var(--chart-1)",
};

export function TableSparkline({
  data,
  width = 60,
  height = 18,
  trend = "flat",
  className,
}: TableSparklineProps) {
  if (data.length < 2) {
    return <span className={cn("text-[11px] text-foreground-muted", className)}>—</span>;
  }
  return (
    <span className={cn("inline-block align-middle", className)} style={{ width, height }}>
      <SparklineChart
        data={[...data]}
        color={TREND_TO_COLOR[trend]}
        fill={false}
        width={width}
        height={height}
        calm
      />
    </span>
  );
}
