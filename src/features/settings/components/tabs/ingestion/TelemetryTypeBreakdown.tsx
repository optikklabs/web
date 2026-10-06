import { PanelCard } from "@shared/components/ui/PanelCard";
import { ownEntry } from "@shared/utils/ownEntry";

import type { IngestionSummary } from "@shared/api/ingestion";
import { Bar } from "./Bar";
import { type IngestionUnit, SIGNAL_COLORS, fmtCount, fmtValue } from "./format";

interface Props {
  readonly summary: IngestionSummary | undefined;
  readonly unit: IngestionUnit;
}

// Share of total ingest per telemetry type, denominated in the active unit.
export function TelemetryTypeBreakdown({ summary, unit }: Props) {
  const bytes = unit === "bytes";
  return (
    <PanelCard title="By telemetry type" subtitle="share of total ingested this period">
      <div className="flex flex-col gap-4">
        {(summary?.byType ?? []).map((row) => {
          const value = bytes ? row.bytes : row.records;
          const share = bytes ? row.bytesPct : row.pct;
          return (
            <div key={row.type}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-medium text-[13px] text-foreground">{row.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="mono font-semibold text-[13px] text-foreground">
                    {fmtValue(unit, value)}
                  </span>
                  <span className="mono text-[12px] text-foreground-muted">
                    {Math.round(share)}%
                  </span>
                </div>
              </div>
              <Bar
                pct={share}
                color={ownEntry(SIGNAL_COLORS, row.type) ?? SIGNAL_COLORS.logs}
                label={`${row.label} ${Math.round(share)}%`}
              />
            </div>
          );
        })}
      </div>

      <div className="my-4 h-px bg-border" />

      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-foreground-muted">Active timeseries</span>
        <span className="mono text-[12.5px] text-foreground">
          {fmtCount(summary?.activeTimeseries)}
        </span>
      </div>
      <div className="mt-1.5 text-[12px] text-foreground-muted leading-relaxed">
        Top by cardinality:{" "}
        <span className="mono text-foreground">{summary?.topCardinalityMetric.name || "—"}</span> ·{" "}
        {fmtCount(summary?.topCardinalityMetric.timeseries)} series
      </div>
    </PanelCard>
  );
}
