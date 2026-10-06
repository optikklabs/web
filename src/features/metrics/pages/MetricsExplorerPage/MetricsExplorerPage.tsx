import { BarChart3 } from "lucide-react";
import { useMemo } from "react";

import PageHeader from "@shared/components/ui/layout/PageHeader";
import { PageShell, PageSurface } from "@shared/components/ui/layout/PageShell";

import { MetricQueryBuilder } from "@shared/metrics/components/MetricQueryBuilder/MetricQueryBuilder";
import { useMetricNames } from "@shared/metrics/hooks/useMetricNames";
import { useMetricsExplorerQuery } from "@shared/metrics/hooks/useMetricsExplorerQuery";
import type { MetricExplorerResults } from "@shared/metrics/types";
import { getDefaultAggregationForMetric } from "@shared/metrics/utils/metricHelpers";
import { FleetDistributionPanel } from "../../components/FleetDistributionPanel";
import { GroupByBreakdownTable } from "../../components/GroupByBreakdownTable";
import { MetricsExplorerChart } from "../../components/MetricsExplorerChart";
import { MetricsExplorerToolbar } from "../../components/MetricsExplorerToolbar";
import { MetricsHeaderActions } from "../../components/MetricsHeaderActions";
import { MetricsKpiStrip } from "../../components/MetricsKpiStrip";
import { RecentMetricsPanel } from "../../components/RecentMetricsPanel";
import { TopSeriesPanel } from "../../components/TopSeriesPanel";
import { useMetricsExplorer } from "../../hooks/useMetricsExplorer";
import { useRecordRecentMetrics } from "../../hooks/useRecordRecentMetrics";

export default function MetricsExplorerPage() {
  const {
    queries,
    formulas,
    chartType,
    step,
    spaceAgg,
    addQuery,
    removeQuery,
    updateQueryAggregation,
    updateQueryMetric,
    updateQueryWhere,
    updateQueryGroupBy,
    addFormula,
    removeFormula,
    updateFormulaExpression,
    setChartType,
    setStep,
    setSpaceAgg,
  } = useMetricsExplorer();

  const { data, isLoading, isError, refetch } = useMetricsExplorerQuery(queries, step);
  const results = (data?.results ?? {}) as MetricExplorerResults;

  useRecordRecentMetrics(queries);

  const primaryQuery = useMemo(() => queries.find((q) => q.metricName), [queries]);
  const primaryResult = primaryQuery ? results[primaryQuery.id] : undefined;

  const { data: metricNames } = useMetricNames("");
  const primaryUnit = useMemo(
    () => metricNames?.metrics.find((m) => m.name === primaryQuery?.metricName)?.unit,
    [metricNames, primaryQuery]
  );

  const reselectMetric = (metricName: string) => {
    if (!primaryQuery) return;
    const entry = metricNames?.metrics.find((metric) => metric.name === metricName);
    updateQueryMetric(
      primaryQuery.id,
      metricName,
      getDefaultAggregationForMetric(entry, primaryQuery.aggregation)
    );
  };

  return (
    <PageShell>
      <PageHeader
        title="Metrics Explorer"
        icon={<BarChart3 size={22} />}
        subtitle="Query, slice and correlate metrics across your services."
        actions={
          <MetricsHeaderActions
            primaryQuery={primaryQuery}
            primaryResult={primaryResult}
            queries={queries}
            formulas={formulas}
            step={step}
            spaceAgg={spaceAgg}
          />
        }
      />

      <PageSurface padding="lg" className="relative z-[40] overflow-visible">
        <MetricQueryBuilder
          queries={queries}
          formulas={formulas}
          onAddQuery={addQuery}
          onRemoveQuery={removeQuery}
          onAggregationChange={updateQueryAggregation}
          onMetricChange={updateQueryMetric}
          onWhereChange={updateQueryWhere}
          onGroupByChange={updateQueryGroupBy}
          onAddFormula={addFormula}
          onRemoveFormula={removeFormula}
          onFormulaExpressionChange={updateFormulaExpression}
        />
      </PageSurface>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.1fr_1fr]">
        <div className="flex flex-col gap-4">
          <PageSurface padding="lg" className="flex flex-col gap-3">
            <MetricsExplorerToolbar
              chartType={chartType}
              step={step}
              spaceAgg={spaceAgg}
              onChartTypeChange={setChartType}
              onStepChange={setStep}
              onSpaceAggChange={setSpaceAgg}
            />
            <MetricsKpiStrip
              primaryQuery={primaryQuery}
              results={results}
              spaceAgg={spaceAgg}
              unit={primaryUnit}
            />
          </PageSurface>

          {chartType === "heat" ? (
            <FleetDistributionPanel result={primaryResult} />
          ) : chartType === "top" ? (
            <TopSeriesPanel result={primaryResult} unit={primaryUnit} />
          ) : (
            <MetricsExplorerChart
              queries={queries}
              formulas={formulas}
              results={results}
              chartType={chartType}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => refetch()}
            />
          )}
        </div>

        {chartType !== "top" && <TopSeriesPanel result={primaryResult} unit={primaryUnit} />}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.1fr_1fr]">
        <FleetDistributionPanel result={primaryResult} />
        <RecentMetricsPanel
          primaryMetric={primaryQuery?.metricName}
          primaryResult={primaryResult}
          onSelectMetric={reselectMetric}
        />
      </div>

      <GroupByBreakdownTable primaryQuery={primaryQuery} result={primaryResult} />
    </PageShell>
  );
}
