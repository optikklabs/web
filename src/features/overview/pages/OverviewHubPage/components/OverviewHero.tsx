import type { ServiceCatalogRedSummary } from "@shared/api/red/redApi";
import StatCard from "@shared/components/ui/cards/StatCard";
import { formatDuration, formatNumber, formatPercentage } from "@shared/utils/formatters";

interface Props {
  readonly summary: ServiceCatalogRedSummary | undefined;
  readonly loading: boolean;
}

export default function OverviewHero({ summary, loading }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        metric={{
          title: "Requests",
          value: summary ? formatNumber(summary.totalSpanCount) : "—",
          description: summary && `${formatNumber(summary.totalErrors)} errors`,
        }}
        visuals={{
          loading,
        }}
      />
      <StatCard
        metric={{
          title: "Error rate",
          value: summary ? formatPercentage(summary.avgErrorRate) : "—",
          description: summary && "of total requests",
        }}
        visuals={{
          loading,
        }}
      />
      <StatCard
        metric={{
          title: "Latency p50",
          value: summary ? formatDuration(summary.avgP50Ms) : "—",
          description: summary && "median latency",
        }}
        visuals={{ loading }}
      />
      <StatCard
        metric={{
          title: "Latency p95",
          value: summary ? formatDuration(summary.avgP95Ms) : "—",
          description: summary && "upper latency",
        }}
        visuals={{ loading }}
      />
      <StatCard
        metric={{
          title: "Latency p99",
          value: summary ? formatDuration(summary.avgP99Ms) : "—",
          description: summary && "tail latency",
        }}
        visuals={{ loading }}
      />
    </div>
  );
}
