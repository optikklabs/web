import { KpiCard, type KpiTone } from "@shared/components/ui/cards/StatCard";
import type { ServiceSummary } from "@shared/metrics/hooks/useServiceSummaryQuery";
import { fmtMs, fmtNum, fmtPct } from "@shared/utils/formatters";

interface ServiceKpiStripProps {
  readonly summary: ServiceSummary | null;
}

function errorTone(errRate: number): KpiTone {
  if (errRate >= 2) return "err";
  if (errRate >= 0.5) return "warn";
  return "ok";
}

function p99Tone(p99Ms: number): KpiTone {
  if (p99Ms >= 2000) return "err";
  if (p99Ms >= 1000) return "warn";
  return "ok";
}

function saturationTone(sat: number): KpiTone {
  if (sat >= 85) return "err";
  if (sat >= 70) return "warn";
  return "ok";
}

/** The highest utilization reported, or null when none was. */
function saturation(s: ServiceSummary): number | null {
  const reported = [s.cpuUtilization, s.memoryUtilization, s.diskUtilization].filter(
    (v): v is number => v !== null
  );
  return reported.length > 0 ? Math.max(...reported) : null;
}

export function ServiceKpiStrip({ summary }: ServiceKpiStripProps) {
  if (!summary) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["Requests", "Error rate", "p99 Latency", "Saturation"].map((label) => (
          <KpiCard key={label} label={label} value="—" />
        ))}
      </div>
    );
  }
  const errorsPerSec = (summary.errorRate / 100) * summary.rps;
  const sat = saturation(summary);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Requests"
        value={fmtNum(summary.requestCount)}
        secondary="req"
        subtext={`${summary.rps >= 1 ? fmtNum(summary.rps) : summary.rps.toFixed(2)} rps`}
      />
      <KpiCard
        label="Error rate"
        value={fmtPct(summary.errorRate, summary.errorRate < 0.1 ? 3 : 2)}
        tone={errorTone(summary.errorRate)}
        subtext={`${fmtNum(errorsPerSec)} errors/s`}
      />
      <KpiCard label="p99 Latency" value={fmtMs(summary.p99Ms)} tone={p99Tone(summary.p99Ms)} />
      <KpiCard
        label="Saturation"
        value={sat === null ? "—" : fmtPct(sat, 1)}
        tone={sat === null ? undefined : saturationTone(sat)}
        subtext={sat === null ? "not reported" : undefined}
      />
    </div>
  );
}
