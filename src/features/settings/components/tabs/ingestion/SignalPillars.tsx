import { PanelCard } from "@shared/components/ui/PanelCard";

import type { IngestionSummary } from "@shared/api/ingestion";
import { Bar } from "./Bar";
import { type IngestionUnit, SIGNAL_COLORS, fmtBytes, fmtCount, fmtValue } from "./format";

interface Props {
  readonly summary: IngestionSummary | undefined;
  readonly unit: IngestionUnit;
}

function dailyAvg(value: number | undefined, days: number | undefined): number {
  if (!value || !days) return 0;
  return value / days;
}

// Per-signal summary cards. Logs and spans switch with the unit; the metrics
// card keeps its cost drivers (active timeseries + datapoints), which have no
// byte denomination — so its units stay labeled rather than blurred.
export function SignalPillars({ summary, unit }: Props) {
  const bytes = unit === "bytes";
  const days = summary?.daysElapsed;
  const logs = summary?.byType.find((t) => t.type === "logs");
  const spans = summary?.byType.find((t) => t.type === "spans");
  const metrics = summary?.byType.find((t) => t.type === "metrics");

  const value = (t: typeof logs) => (bytes ? t?.bytes : t?.records);
  const share = (t: typeof logs) => (bytes ? t?.bytesPct : t?.pct) ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <PanelCard title="Logs" subtitle="record volume this period">
        <div className="mono mb-3 font-bold text-[20px] text-foreground">
          {fmtValue(unit, value(logs))}
        </div>
        <Bar
          pct={share(logs)}
          color={SIGNAL_COLORS.logs}
          label={`Logs ${Math.round(share(logs))}%`}
        />
        <div className="mt-3 flex justify-between text-[12px] text-foreground-muted">
          <span>{Math.round(share(logs))}% of ingest</span>
          <span className="mono">{fmtValue(unit, dailyAvg(value(logs), days))} / day</span>
        </div>
      </PanelCard>

      <PanelCard title="Spans (APM)" subtitle="span volume this period">
        <div className="mono mb-3 font-bold text-[20px] text-foreground">
          {fmtValue(unit, value(spans))}
        </div>
        <Bar
          pct={share(spans)}
          color={SIGNAL_COLORS.spans}
          label={`Spans ${Math.round(share(spans))}%`}
        />
        <div className="mt-3 flex justify-between text-[12px] text-foreground-muted">
          <span>{Math.round(share(spans))}% of ingest</span>
          <span className="mono">{fmtValue(unit, dailyAvg(value(spans), days))} / day</span>
        </div>
      </PanelCard>

      <PanelCard title="Custom metrics" subtitle="active timeseries & cardinality">
        <div className="mono mb-3 font-bold text-[20px] text-foreground">
          {fmtCount(summary?.activeTimeseries)}
        </div>
        <Bar
          pct={share(metrics)}
          color={SIGNAL_COLORS.metrics}
          label={`Metrics ${Math.round(share(metrics))}%`}
        />
        <div className="mt-3 flex justify-between text-[12px] text-foreground-muted">
          <span>
            {bytes ? fmtBytes(metrics?.bytes) : `${fmtCount(metrics?.records)} datapoints`}
          </span>
          <span className="mono">{Math.round(share(metrics))}% of ingest</span>
        </div>
      </PanelCard>
    </div>
  );
}
