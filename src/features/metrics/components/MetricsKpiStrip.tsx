import { KpiCard } from "@shared/components/ui/cards/StatCard";
import { DeltaBadge } from "@shared/metrics/components/DeltaBadge";
import type {
  MetricExplorerResults,
  MetricQueryDefinition,
  MetricSpaceAggregation,
} from "@shared/metrics/types";
import { formatStatValue } from "@shared/metrics/utils/formatStat";
import { computeQuerySummary } from "@shared/metrics/utils/seriesStats";

interface MetricsKpiStripProps {
  readonly primaryQuery: MetricQueryDefinition | undefined;
  readonly results: MetricExplorerResults;
  readonly spaceAgg: MetricSpaceAggregation;
  readonly unit?: string;
}

interface KpiCell {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly delta?: number | null;
}

export function MetricsKpiStrip({ primaryQuery, results, spaceAgg, unit }: MetricsKpiStripProps) {
  const summary = computeQuerySummary(
    primaryQuery ? results[primaryQuery.id] : undefined,
    spaceAgg
  );
  const valueUnit = unit ?? "";
  const cells: KpiCell[] = [
    {
      label: "current",
      value: formatStatValue(summary.current),
      unit: valueUnit,
      delta: summary.delta,
    },
    { label: "1h avg", value: formatStatValue(summary.avg), unit: valueUnit },
    { label: "1h min", value: formatStatValue(summary.min), unit: valueUnit },
    { label: "1h max", value: formatStatValue(summary.max), unit: valueUnit },
    { label: "samples", value: formatStatValue(summary.samples), unit: "pts" },
    { label: "cardinality", value: String(summary.cardinality), unit: "series" },
  ];

  return (
    <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cells.map((cell) => (
        <KpiCard
          key={cell.label}
          label={cell.label}
          value={cell.value}
          secondary={cell.unit || undefined}
          delta={cell.delta !== undefined ? <DeltaBadge delta={cell.delta} /> : undefined}
        />
      ))}
    </div>
  );
}
