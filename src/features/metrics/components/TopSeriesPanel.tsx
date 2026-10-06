import { useMemo, useState } from "react";

import { PageSurface } from "@shared/components/ui/layout/PageShell";

import { DeltaBadge } from "@shared/metrics/components/DeltaBadge";
import {
  MetricSegmentedControl,
  type SegmentOption,
} from "@shared/metrics/components/MetricSegmentedControl";
import type { MetricQueryResult, TopSeriesGroupBy } from "@shared/metrics/types";
import { formatStatValue } from "@shared/metrics/utils/formatStat";
import { buildTopSeriesRows } from "../utils/topSeries";

interface TopSeriesPanelProps {
  readonly result: MetricQueryResult | undefined;
  readonly unit?: string;
}

const GROUP_BY_SEGMENTS: ReadonlyArray<SegmentOption<TopSeriesGroupBy>> = [
  { value: "host", label: "host" },
  { value: "region", label: "region" },
  { value: "version", label: "version" },
];

const VISIBLE_ROWS = 8;

/** Right-hand panel ranking the primary query's series by current value. */
export function TopSeriesPanel({ result, unit }: TopSeriesPanelProps) {
  const [groupBy, setGroupBy] = useState<TopSeriesGroupBy>("host");
  const [expanded, setExpanded] = useState(false);

  const rows = useMemo(() => buildTopSeriesRows(result, groupBy), [result, groupBy]);
  const maxValue = rows[0]?.current ?? 1;
  const shown = expanded ? rows : rows.slice(0, VISIBLE_ROWS);
  const hidden = rows.length - VISIBLE_ROWS;

  return (
    <PageSurface padding="lg" className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-[15px] text-foreground tracking-[0.01em]">
            Top series
          </div>
          <div className="mt-0.5 text-[12px] text-foreground-muted">
            By current value · grouped by {groupBy}
          </div>
        </div>
        <MetricSegmentedControl
          options={GROUP_BY_SEGMENTS}
          value={groupBy}
          onChange={setGroupBy}
          size="sm"
        />
      </div>

      <div className="mt-3.5 flex flex-col gap-2">
        {shown.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-foreground-muted">
            No series to rank.
          </div>
        ) : (
          shown.map((row) => {
            const pct = Math.min(100, maxValue > 0 ? (row.current / maxValue) * 100 : 0);
            const hot = pct >= 80;
            return (
              <div key={row.label} className="relative overflow-hidden rounded-[5px] px-2 py-1.5">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${pct}%`,
                    background: hot
                      ? "color-mix(in oklab, var(--color-error) 8%, transparent)"
                      : "color-mix(in oklab, var(--color-primary) 6%, transparent)",
                  }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-mono text-[11.5px] text-foreground">
                      {row.label}
                    </span>
                    {row.sublabel ? (
                      <span className="font-mono text-[10.5px] text-foreground-muted">
                        {row.sublabel}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <DeltaBadge delta={row.delta} className="text-[10.5px]" />
                    <span
                      className="font-mono font-semibold text-[12px]"
                      style={{ color: hot ? "var(--color-error)" : "var(--text-primary)" }}
                    >
                      {formatStatValue(row.current)}
                      {unit ? (
                        <span className="font-normal text-foreground-muted"> {unit}</span>
                      ) : null}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {hidden > 0 ? (
        <>
          <div className="my-3 h-px bg-border" />
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-7 w-full items-center justify-center text-[12px] text-foreground-secondary hover:text-foreground"
          >
            {expanded ? "Show less" : `Show ${hidden} more`}
          </button>
        </>
      ) : null}
    </PageSurface>
  );
}
