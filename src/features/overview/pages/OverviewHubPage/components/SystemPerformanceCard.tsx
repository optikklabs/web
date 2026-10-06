import { useMemo } from "react";

import { Card as Surface } from "@shared/components/primitives/ui/card";
import ObservabilityChart, {
  type ObservabilityChartSeries,
} from "@shared/components/ui/charts/ObservabilityChart";
import ChartNoDataOverlay from "@shared/components/ui/feedback/ChartNoDataOverlay";
import { fmtNum } from "@shared/utils/formatters";

import { useSystemPerformanceQuery } from "../hooks/useOverviewModel";

const CHART_HEIGHT = 200;
const REQUESTS_COLOR = "var(--chart-1)";
const ERRORS_COLOR = "var(--err)";

export default function SystemPerformanceCard() {
  const query = useSystemPerformanceQuery();

  const { timestamps, series } = useMemo(() => {
    const rows = query.data ?? [];
    const timestamps = rows.map((r) => Math.floor(r.timestampMs / 1000));
    const series: ObservabilityChartSeries[] = [
      {
        label: "Requests",
        values: rows.map((r) => r.requestCount),
        color: REQUESTS_COLOR,
        fill: true,
        scale: "y",
      },
      {
        label: "Errors",
        values: rows.map((r) => r.errorCount),
        color: ERRORS_COLOR,
        width: 1.5,
        scale: "errors",
      },
    ];
    return { timestamps, series };
  }, [query.data]);

  const showEmpty = !query.isPending && timestamps.length === 0;

  return (
    <Surface elevation={1} padding="md" className="relative flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-semibold text-[13px] text-foreground">System performance</div>
          <div className="text-[11px] text-foreground-muted">
            Requests and errors over the selected time range
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3" style={{ backgroundColor: REQUESTS_COLOR }} />
            requests
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3" style={{ backgroundColor: ERRORS_COLOR }} />
            errors
          </span>
        </div>
      </div>

      <div className="relative w-full" style={{ height: CHART_HEIGHT }}>
        {showEmpty ? (
          <ChartNoDataOverlay />
        ) : (
          <ObservabilityChart
            type="line"
            timestamps={timestamps}
            series={series}
            height={CHART_HEIGHT}
            yMin={0}
            yFormatter={(v) => fmtNum(v)}
            isLoading={query.isPending}
          />
        )}
      </div>
    </Surface>
  );
}
