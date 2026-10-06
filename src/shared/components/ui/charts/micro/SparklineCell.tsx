import { cn } from "@shared/lib/utils";

interface SparklineCellProps {
  readonly values: number[];
  readonly tone?: "info" | "warn" | "err";
  readonly width?: number;
  readonly height?: number;
  readonly className?: string;
}

const TONE_LINE: Record<NonNullable<SparklineCellProps["tone"]>, string> = {
  info: "var(--color-info,#3b82f6)",
  warn: "var(--color-warning,#f59e0b)",
  err: "var(--color-error,#ef4444)",
};

const TONE_FILL: Record<NonNullable<SparklineCellProps["tone"]>, string> = {
  info: "rgba(59,130,246,0.15)",
  warn: "rgba(245,158,11,0.15)",
  err: "rgba(239,68,68,0.15)",
};

function buildPaths(values: number[], width: number, height: number) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(0.001, max - min);
  const line = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  return { line, area };
}

export function SparklineCell({
  values,
  tone = "info",
  width = 86,
  height = 22,
  className,
}: SparklineCellProps) {
  if (values.length < 2) {
    return <span className="text-[11px] text-foreground-muted">—</span>;
  }
  const { line, area } = buildPaths(values, width, height);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="presentation"
      className={cn("block max-w-full", className)}
    >
      <path d={area} fill={TONE_FILL[tone]} />
      <path d={line} fill="none" stroke={TONE_LINE[tone]} strokeWidth={1.25} />
    </svg>
  );
}
