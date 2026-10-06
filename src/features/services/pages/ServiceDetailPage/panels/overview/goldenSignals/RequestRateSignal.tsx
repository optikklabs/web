import ObservabilityChart, {
  type ObservabilityChartSeries,
} from "@shared/components/ui/charts/ObservabilityChart";

import { PanelCard } from "@shared/components/ui/PanelCard";
import { getChartColor } from "@shared/utils/chartTheme";
import { fmtNum } from "@shared/utils/formatters";
import { SIGNAL_CHART_HEIGHT, SignalLegend } from "./SignalCardShell";
import { useEndpointRED } from "./useEndpointRED";

// One line per endpoint; headline is the whole-service rate.
export function RequestRateSignal({ serviceName }: { serviceName: string }) {
  const query = useEndpointRED(serviceName);

  const timestamps = (query.data?.timestamps ?? []).map((ms) => ms / 1000);
  const endpoints = query.data?.series ?? [];

  const series: ObservabilityChartSeries[] = endpoints.map((endpoint, index) => ({
    label: endpoint.operationName,
    values: endpoint.rps,
    color: getChartColor(index),
    fill: false,
  }));

  // Whole-service average, not a sum of the charted lines.
  const totals = query.data?.totals.rps ?? [];
  let total = 0;
  for (const rps of totals) total += rps;
  const avg = totals.length > 0 ? total / totals.length : 0;

  return (
    <PanelCard
      title="Request rate"
      subtitle="rps · per endpoint"
      action={<SignalLegend>avg {fmtNum(avg)} rps</SignalLegend>}
    >
      <ObservabilityChart
        type="line"
        timestamps={timestamps}
        series={series}
        height={SIGNAL_CHART_HEIGHT}
        yFormatter={(v) => fmtNum(v)}
        legend
        isLoading={query.isLoading}
      />
    </PanelCard>
  );
}
