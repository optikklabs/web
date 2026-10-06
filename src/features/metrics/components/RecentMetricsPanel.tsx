import { ChevronRight } from "lucide-react";

import SparklineChart from "@shared/components/ui/charts/micro/SparklineChart";
import { PageSurface } from "@shared/components/ui/layout/PageShell";
import { getChartColor } from "@shared/utils/chartTheme";

import { useMetricNames } from "@shared/metrics/hooks/useMetricNames";
import type { MetricNameEntry, MetricQueryResult } from "@shared/metrics/types";
import { useMetricsStore } from "../store/metricsStore";

interface RecentMetricsPanelProps {
  /** Metric name currently driving the primary query, if any. */
  readonly primaryMetric: string | undefined;

  readonly primaryResult: MetricQueryResult | undefined;
  readonly onSelectMetric: (metricName: string) => void;
}

function primarySpark(result: MetricQueryResult | undefined): number[] | undefined {
  const series = result?.series[0];
  if (!series) return undefined;
  const clean = series.values.filter((v): v is number => v != null && !Number.isNaN(v));
  return clean.length >= 2 ? clean : undefined;
}

export function RecentMetricsPanel({
  primaryMetric,
  primaryResult,
  onSelectMetric,
}: RecentMetricsPanelProps) {
  const recentMetrics = useMetricsStore((s) => s.recentMetrics);
  const { data } = useMetricNames("");

  const metaByName = new Map<string, MetricNameEntry>(
    (data?.metrics ?? []).map((entry) => [entry.name, entry])
  );

  return (
    <PageSurface padding="lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-[15px] text-foreground tracking-[0.01em]">
            Recent metrics
          </div>
          <div className="mt-0.5 text-[12px] text-foreground-muted">
            Metrics you queried recently
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col">
        {recentMetrics.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-foreground-muted">
            Query a metric to see it here.
          </div>
        ) : (
          recentMetrics.map((name, i) => {
            const meta = metaByName.get(name);
            const spark = name === primaryMetric ? primarySpark(primaryResult) : undefined;
            return (
              <button
                type="button"
                key={name}
                onClick={() => onSelectMetric(name)}
                className="flex items-center gap-2.5 border-border border-b px-1 py-2 text-left last:border-b-0 hover:bg-accent"
              >
                <span className="h-5 w-16 shrink-0">
                  {spark ? (
                    <SparklineChart
                      data={spark}
                      color={getChartColor(i)}
                      width={64}
                      height={20}
                      fill={false}
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[12px] text-foreground">
                    {name}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-foreground-muted">
                    <span className="font-mono">{meta?.type ?? "metric"}</span>
                    {meta?.unit ? ` · ${meta.unit}` : ""}
                  </span>
                </span>
                <ChevronRight size={13} className="shrink-0 text-foreground-muted" />
              </button>
            );
          })
        )}
      </div>
    </PageSurface>
  );
}
