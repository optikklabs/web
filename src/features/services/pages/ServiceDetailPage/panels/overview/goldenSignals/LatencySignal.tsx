import { useMemo } from "react";

import ObservabilityChart, {
  type ObservabilityChartSeries,
} from "@shared/components/ui/charts/ObservabilityChart";

import {
  type LatencyPercentilesPoint,
  getLatencyPercentilesTimeseries,
} from "@shared/api/red/redApi";
import { PanelCard } from "@shared/components/ui/PanelCard";
import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";
import { fmtMs } from "@shared/utils/formatters";
import { SIGNAL_CHART_HEIGHT, SignalLegend } from "./SignalCardShell";

/**
 * Latency golden signal — uses `getLatencyPercentilesTimeseries` (same
 * endpoint as the service drawer) for 100% data consistency across views.
 */
export function LatencySignal({ serviceName }: { serviceName: string }) {
  const query = useTimeRangeQuery<LatencyPercentilesPoint[]>(
    `service-detail.latency:${serviceName}`,
    (start, end) => getLatencyPercentilesTimeseries(start, end, serviceName),
    { enabled: Boolean(serviceName) }
  );

  const points = query.data ?? [];

  const { timestamps, series, latestP99 } = useMemo(() => {
    if (points.length === 0) return { timestamps: [], series: [], latestP99: 0 };

    const ts = points.map((p) => p.timestampMs / 1000);
    const values = points.map((p) => p.p99Ms);

    const val = values.findLast((v) => v != null) ?? 0;

    const chartSeries: ObservabilityChartSeries[] = [
      { label: "p99", values, color: "var(--chart-3)", fill: false },
    ];

    return { timestamps: ts, series: chartSeries, latestP99: val };
  }, [points]);

  return (
    <PanelCard
      title="Latency"
      subtitle="p99 · ms · service"
      action={<SignalLegend>p99 {fmtMs(latestP99)}</SignalLegend>}
    >
      <ObservabilityChart
        type="line"
        timestamps={timestamps}
        series={series}
        height={SIGNAL_CHART_HEIGHT}
        yFormatter={(v) => fmtMs(v)}
        legend
        isLoading={query.isLoading}
      />
    </PanelCard>
  );
}
