import { Card } from "@shared/components/primitives/ui/card";

import InfraMultiSeriesChart from "./InfraMultiSeriesChart";
import type { SeriesFormat } from "./seriesFormat";

export interface ChartDef<G extends string = string> {
  readonly group: G;
  readonly title: string;
  readonly label: string;
  readonly format: SeriesFormat;
}

export function availableCharts<G extends string>(
  charts: readonly ChartDef<G>[],
  availableMetrics: readonly string[] | null
): readonly ChartDef<G>[] {
  if (availableMetrics == null) return charts;
  return charts.filter((c) => availableMetrics.includes(c.group));
}

interface SeriesChartCardProps {
  readonly endpoint: string;
  readonly queryKeyPrefix: string;
  readonly def: ChartDef;
}

export function SeriesChartCard({ endpoint, queryKeyPrefix, def }: SeriesChartCardProps) {
  return (
    <Card padding="md" className="border-border">
      <InfraMultiSeriesChart
        queryKey={`${queryKeyPrefix}.${def.group}`}
        endpoint={endpoint}
        title={def.title}
        format={def.format}
        datasetLabel={def.label}
        metric={def.group}
      />
    </Card>
  );
}
