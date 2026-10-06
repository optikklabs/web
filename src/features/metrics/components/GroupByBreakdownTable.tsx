import { useVirtualizer } from "@tanstack/react-virtual";
import { Download } from "lucide-react";
import { useMemo, useRef } from "react";

import { Button } from "@shared/components/primitives/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/primitives/ui/table";
import { TableSparkline } from "@shared/components/primitives/ui/table-sparkline";
import { PageSurface } from "@shared/components/ui/layout/PageShell";

import { DeltaBadge } from "@shared/metrics/components/DeltaBadge";
import type { MetricQueryDefinition, MetricQueryResult } from "@shared/metrics/types";
import { formatStatValue } from "@shared/metrics/utils/formatStat";
import { computeSeriesStats } from "@shared/metrics/utils/seriesStats";
import { buildBreakdownCsv, collectTagKeys, downloadCsv } from "../utils/breakdownCsv";

interface GroupByBreakdownTableProps {
  readonly primaryQuery: MetricQueryDefinition | undefined;
  readonly result: MetricQueryResult | undefined;
}

function lastWindow(values: ReadonlyArray<number | null>): number[] {
  return values.filter((v): v is number => v != null && !Number.isNaN(v)).slice(-30);
}

/** Per-series breakdown table. One row per group-by combination, with min/avg/
 * p95/p99/max computed over each series' own value array across the window. */
export function GroupByBreakdownTable({ primaryQuery, result }: GroupByBreakdownTableProps) {
  const tagKeys = collectTagKeys(result);

  const rows = useMemo(() => {
    if (!result) return [];
    return result.series.map((series) => ({
      tags: series.tags,
      stats: computeSeriesStats(series),
      spark: lastWindow(series.values),
    }));
  }, [result]);

  const groupByLabel = primaryQuery?.groupBy.join(", ") || "—";

  const handleExport = () => {
    const csv = buildBreakdownCsv(result);
    if (csv) downloadCsv(`${primaryQuery?.metricName || "metrics"}-breakdown.csv`, csv);
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const lastItem = virtualItems.at(-1);
  const paddingTop = virtualItems[0]?.start ?? 0;
  const paddingBottom = lastItem ? virtualizer.getTotalSize() - lastItem.end : 0;

  return (
    <PageSurface padding="lg" className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 pb-3">
        <div>
          <div className="font-semibold text-[15px] text-foreground tracking-[0.01em]">
            Group-by breakdown
          </div>
          <div className="mt-0.5 text-[12px] text-foreground-muted">
            <span className="font-mono">{primaryQuery?.metricName || "—"}</span> · grouped by{" "}
            <span className="font-mono">{groupByLabel}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" icon={<Download size={13} />} onClick={handleExport}>
          CSV
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="py-10 text-center text-[12px] text-foreground-muted">
          No grouped series. Add a group-by to the primary query.
        </div>
      ) : (
        <div className="relative max-h-[600px] overflow-auto" ref={scrollRef}>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
              <TableRow>
                {tagKeys.map((key) => (
                  <TableHead key={key} className="bg-background">
                    {key}
                  </TableHead>
                ))}
                <TableHead className="bg-background text-right">min</TableHead>
                <TableHead className="bg-background text-right">avg</TableHead>
                <TableHead className="bg-background text-right">p95</TableHead>
                <TableHead className="bg-background text-right">p99</TableHead>
                <TableHead className="bg-background text-right">max</TableHead>
                <TableHead className="w-[180px] bg-background">Last 1h</TableHead>
                <TableHead className="w-[90px] bg-background text-right">Δ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualItems.map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;
                return (
                  <TableRow key={virtualRow.index}>
                    {tagKeys.map((key) => (
                      <TableCell key={key} className="font-mono text-[12px] text-foreground">
                        {row.tags[key] ?? "—"}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-mono">
                      {formatStatValue(row.stats.min)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatStatValue(row.stats.avg)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {formatStatValue(row.stats.p95)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatStatValue(row.stats.p99)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatStatValue(row.stats.max)}
                    </TableCell>
                    <TableCell>
                      <TableSparkline
                        data={row.spark}
                        width={170}
                        height={26}
                        trend={
                          row.stats.delta == null || row.stats.delta === 0
                            ? "flat"
                            : row.stats.delta > 0
                              ? "down"
                              : "up"
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DeltaBadge delta={row.stats.delta} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </PageSurface>
  );
}
