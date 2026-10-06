import ObservabilityChart, {
  type ObservabilityChartSeries,
} from "@shared/components/ui/charts/ObservabilityChart";

import { PanelCard } from "@shared/components/ui/PanelCard";
import { getChartColor } from "@shared/utils/chartTheme";
import { fmtNum } from "@shared/utils/formatters";
import { SIGNAL_CHART_HEIGHT, SignalLegend } from "./SignalCardShell";
import { useEndpointRED } from "./useEndpointRED";

// Raw request counts per bucket, the un-normalised twin of the rate card.
// Bucket width varies with the selected window, so values are only comparable
// within one view — the subtitle names the grain to make that explicit.
export function RequestCountSignal({ serviceName }: { serviceName: string }) {
  const query = useEndpointRED(serviceName);

  const timestamps = (query.data?.timestamps ?? []).map((ms) => ms / 1000);
  const endpoints = query.data?.series ?? [];

  const series: ObservabilityChartSeries[] = endpoints.map((endpoint, index) => ({
    label: endpoint.operationName,
    values: endpoint.requestCount,
    color: getChartColor(index),
    fill: false,
  }));

  // Whole-service count, not a sum of the charted lines.
  let total = 0;
  for (const count of query.data?.totals.requestCount ?? []) total += count;

  return (
    <PanelCard
      title="Request count"
      subtitle={`requests per ${bucketLabel(timestamps)} · per endpoint`}
      action={<SignalLegend>{fmtNum(total)} total</SignalLegend>}
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

// Bucket width read off the axis; the server picks the grain, not the client.
function bucketLabel(timestampsSec: number[]): string {
  const [first, second] = timestampsSec;
  if (first === undefined || second === undefined) return "bucket";
  const seconds = second - first;
  if (seconds >= 86400) return `${seconds / 86400}d`;
  if (seconds >= 3600) return `${seconds / 3600}h`;
  if (seconds >= 60) return `${seconds / 60}m`;
  return `${seconds}s`;
}
