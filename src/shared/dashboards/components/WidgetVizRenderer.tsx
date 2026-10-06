import { AlertCircle, BarChart3 } from "lucide-react";
import { useMemo } from "react";

import type { ColumnDef } from "@tanstack/react-table";

import ObservabilityChart from "@shared/components/ui/charts/ObservabilityChart";
import DataTable from "@shared/components/ui/data-display/DataTable";
import type { WidgetDisplayOptions, WidgetVizType } from "@shared/dashboards/builder/metricsWidget";
import { DeltaBadge } from "@shared/metrics/components/DeltaBadge";
import type {
  FormulaDefinition,
  MetricExplorerResults,
  MetricQueryDefinition,
  MetricQueryResult,
  MetricSeriesData,
} from "@shared/metrics/types";
import { buildSeries } from "@shared/metrics/utils/chartSeries";
import { formatStatValue } from "@shared/metrics/utils/formatStat";
import { computeQuerySummary, computeSeriesStats } from "@shared/metrics/utils/seriesStats";

const MAX_SERIES = 100;

interface WidgetVizRendererProps {
  readonly viz: WidgetVizType;
  readonly queries: MetricQueryDefinition[];
  readonly formulas: FormulaDefinition[];
  readonly results: MetricExplorerResults | undefined;
  readonly display: WidgetDisplayOptions;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly height?: number;
}

/** Cell-sized WYSIWYG renderer shared by the editor preview and saved cards. */
export function WidgetVizRenderer({
  viz,
  queries,
  formulas,
  results,
  display,
  isLoading,
  isError,
  height = 220,
}: WidgetVizRendererProps) {
  const primary = queries.find((q) => q.metricName);
  const hasResults = !!results && Object.keys(results).length > 0;
  const data = results ?? {};

  if (!primary) return <CenteredState icon="empty" message="Select a metric to preview" />;
  if (isError) return <CenteredState icon="error" message="Failed to load data" />;
  if (isLoading && !hasResults) return <CenteredState icon="spinner" />;
  if (!hasResults) return <CenteredState icon="empty" message="No data for this query" />;

  switch (viz) {
    case "value":
      return <ValueViz query={primary} results={data} height={height} />;
    case "toplist":
      return <ToplistViz query={primary} results={data} />;
    case "table":
      return <TableViz query={primary} results={data} height={height} />;
    default:
      return (
        <TimeseriesViz
          queries={queries}
          formulas={formulas}
          results={data}
          display={display}
          height={height}
        />
      );
  }
}

interface TimeseriesVizProps {
  readonly queries: MetricQueryDefinition[];
  readonly formulas: FormulaDefinition[];
  readonly results: MetricExplorerResults;
  readonly display: WidgetDisplayOptions;
  readonly height: number;
}

function TimeseriesViz({ queries, formulas, results, display, height }: TimeseriesVizProps) {
  const { timestamps, series } = useMemo(
    () => buildSeries(queries, formulas, results, "line"),
    [queries, formulas, results]
  );
  // Mirror the explorer's smoothing behavior for WYSIWYG parity.
  const adjusted = display.smooth ? series : series.map((s) => ({ ...s, width: 1 }));
  const rendered = adjusted.slice(0, MAX_SERIES);

  return (
    <ObservabilityChart
      timestamps={timestamps}
      series={rendered}
      type="line"
      height={height}
      legend={display.legend}
    />
  );
}

/** Value, toplist and table cells render the panel's first query with a metric. */
interface SingleQueryVizProps {
  readonly query: MetricQueryDefinition;
  readonly results: MetricExplorerResults;
}

function ValueViz({
  query: primary,
  results,
  height,
}: SingleQueryVizProps & { readonly height: number }) {
  const result = results[primary.id];
  const summary = computeQuerySummary(result, primary.spaceAggregation);
  const spark = useMemo(() => buildSeries([primary], [], results, "area"), [primary, results]);
  const sparkHeight = Math.min(64, Math.max(40, height - 96));

  return (
    <div className="flex h-full flex-col justify-center gap-1.5 px-2">
      <div className="font-mono font-semibold text-[28px] text-foreground leading-none">
        {formatStatValue(summary.current)}
      </div>
      <div className="flex items-center gap-2">
        <span className="truncate font-mono text-[11px] text-foreground-muted">
          {primary.aggregation}({primary.metricName})
        </span>
        <DeltaBadge delta={summary.delta} className="text-[10.5px]" />
      </div>
      {spark.series.length > 0 ? (
        <ObservabilityChart
          timestamps={spark.timestamps}
          series={spark.series}
          type="area"
          height={sparkHeight}
          yAxisSize={0}
          legend={false}
        />
      ) : null}
    </div>
  );
}

function ToplistViz({ query: primary, results }: SingleQueryVizProps) {
  const rows = useMemo(
    () => buildRankedRows(results[primary.id], primary.metricName),
    [results, primary.id, primary.metricName]
  );
  const top = rows[0];
  if (!top) return <CenteredState icon="empty" message="No series to rank" />;
  const max = top.value;

  return (
    <div className="flex h-full flex-col gap-1.5 overflow-y-auto px-1 py-1">
      {rows.map((row) => {
        const pct = Math.min(100, max > 0 ? (row.value / max) * 100 : 0);
        return (
          <div key={row.label} className="relative overflow-hidden rounded-[5px] px-2 py-1">
            <div
              className="absolute inset-y-0 left-0 bg-[var(--color-primary-subtle-08)]"
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[11px] text-foreground">{row.label}</span>
              <div className="flex shrink-0 items-center gap-2">
                <DeltaBadge delta={row.delta} className="text-[10px]" />
                <span className="font-mono font-semibold text-[11.5px] text-foreground">
                  {formatStatValue(row.value)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface SeriesStatsRow {
  readonly label: string;
  readonly stats: ReturnType<typeof computeSeriesStats>;
}

function statColumn(
  header: string,
  key: "min" | "avg" | "max" | "last",
  className = "text-foreground-secondary"
): ColumnDef<SeriesStatsRow> {
  return {
    header,
    id: key,
    size: 80,
    meta: { align: "right" },
    cell: ({ row: { original: row } }) => (
      <span className={`font-mono ${className}`}>{formatStatValue(row.stats[key])}</span>
    ),
  };
}

const SERIES_STATS_COLUMNS: ColumnDef<SeriesStatsRow>[] = [
  {
    header: "Series",
    accessorKey: "label",
    cell: ({ row: { original: row } }) => (
      <span className="block truncate font-mono text-foreground">{row.label}</span>
    ),
  },
  statColumn("Min", "min"),
  statColumn("Avg", "avg"),
  statColumn("Max", "max"),
  statColumn("Last", "last", "font-semibold text-foreground"),
];

const TABLE_ROW_HEIGHT = 36;
/** Header row height plus the DataTable border, subtracted from the cell height. */
const TABLE_CHROME_HEIGHT = 38;

function TableViz({
  query: primary,
  results,
  height,
}: SingleQueryVizProps & { readonly height: number }) {
  const rows: SeriesStatsRow[] = (results[primary.id]?.series ?? []).map((s) => ({
    label: seriesLabel(s, primary.metricName),
    stats: computeSeriesStats(s),
  }));
  const maxRows = Math.max(1, Math.floor((height - TABLE_CHROME_HEIGHT) / TABLE_ROW_HEIGHT));

  return (
    <DataTable
      data={{ columns: SERIES_STATS_COLUMNS, rows }}
      config={{ emptyText: "No data", maxRows, rowHeight: TABLE_ROW_HEIGHT }}
    />
  );
}

interface RankedRow {
  readonly label: string;
  readonly value: number;
  readonly delta: number | null;
}

/** Ranks a query's series by their latest value, highest first. */
function buildRankedRows(result: MetricQueryResult | undefined, metricName: string): RankedRow[] {
  if (!result) return [];
  return result.series
    .map((s) => {
      const stats = computeSeriesStats(s);
      return { label: seriesLabel(s, metricName), value: stats.last ?? 0, delta: stats.delta };
    })
    .sort((a, b) => b.value - a.value);
}

function seriesLabel(series: MetricSeriesData, metricName: string): string {
  return Object.values(series.tags).join(", ") || metricName;
}

function CenteredState({
  icon,
  message,
}: {
  readonly icon: "empty" | "error" | "spinner";
  readonly message?: string;
}) {
  return (
    <div className="flex h-full min-h-[80px] flex-col items-center justify-center gap-2 text-center">
      {icon === "spinner" ? (
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground-muted border-t-primary" />
      ) : icon === "error" ? (
        <AlertCircle size={20} className="text-error opacity-70" />
      ) : (
        <BarChart3 size={20} className="text-foreground-muted opacity-40" />
      )}
      {message ? <div className="text-[11.5px] text-foreground-muted">{message}</div> : null}
    </div>
  );
}
