import ObservabilityChart, {
  type ObservabilityChartSeries,
} from "@shared/components/ui/charts/ObservabilityChart";

import { PanelCard } from "@shared/components/ui/PanelCard";
import { getChartColor } from "@shared/utils/chartTheme";
import { fmtPct } from "@shared/utils/formatters";
import { SIGNAL_CHART_HEIGHT, SignalLegend } from "./SignalCardShell";
import { useEndpointRED } from "./useEndpointRED";

// One line per endpoint. Null buckets stay null so the line breaks instead of
// reading a misleading 0%.
export function ErrorRateSignal({ serviceName }: { serviceName: string }) {
  const query = useEndpointRED(serviceName);

  const timestamps = (query.data?.timestamps ?? []).map((ms) => ms / 1000);
  const endpoints = query.data?.series ?? [];

  const series: ObservabilityChartSeries[] = endpoints.map((endpoint, index) => ({
    label: endpoint.operationName,
    values: endpoint.errorRate,
    color: getChartColor(index),
    fill: false,
  }));

  // Whole-service peak, not the max of the charted lines.
  let peak = 0;
  for (const rate of query.data?.totals.errorRate ?? []) {
    if (rate != null && rate > peak) peak = rate;
  }

  return (
    <PanelCard
      title="Error rate"
      subtitle="% · per endpoint"
      action={<SignalLegend>peak {fmtPct(peak, peak < 0.1 ? 2 : 1)}</SignalLegend>}
    >
      <ObservabilityChart
        type="line"
        timestamps={timestamps}
        series={series}
        height={SIGNAL_CHART_HEIGHT}
        yFormatter={(v) => fmtPct(v, v < 0.1 ? 2 : 1)}
        legend
        isLoading={query.isLoading}
      />
    </PanelCard>
  );
}
