import { KpiCard, type KpiTone } from "@shared/components/ui/cards/StatCard";
import { fmtMs, fmtPct, formatNumber } from "@shared/utils/formatters";
import { type HealthVariant, healthVariantForErrorRate } from "@shared/utils/statusUtils";

import type { PodOverview } from "../../api/podDetailApi";

const ERROR_RATE_TONE: Record<HealthVariant, KpiTone> = {
  success: "ok",
  warning: "warn",
  error: "err",
};

interface ContainerDetailKpiCardsProps {
  readonly overview: PodOverview | null;
}

interface Tile {
  readonly label: string;
  readonly value: string;
  readonly tone: KpiTone;
  readonly hint?: string;
}

const NO_TRAFFIC: Omit<Tile, "label"> = {
  value: "—",
  tone: "muted",
  hint: "no traffic",
};

function buildTiles(overview: PodOverview | null): Tile[] {
  if (!overview || overview.requestCount === 0) {
    return [
      { label: "Requests", ...NO_TRAFFIC },
      { label: "Error rate", ...NO_TRAFFIC },
      { label: "Avg latency", ...NO_TRAFFIC },
      { label: "p95 latency", ...NO_TRAFFIC },
    ];
  }
  const errTone = ERROR_RATE_TONE[healthVariantForErrorRate(overview.errorRate ?? undefined)];
  return [
    { label: "Requests", value: formatNumber(overview.requestCount), tone: "ok" },
    { label: "Error rate", value: fmtPct(overview.errorRate), tone: errTone },
    { label: "Avg latency", value: fmtMs(overview.avgLatencyMs), tone: "ok" },
    { label: "p95 latency", value: fmtMs(overview.p95LatencyMs), tone: "ok" },
  ];
}

export function ContainerDetailKpiCards({ overview }: ContainerDetailKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {buildTiles(overview).map((t) => (
        <KpiCard key={t.label} label={t.label} value={t.value} tone={t.tone} subtext={t.hint} />
      ))}
    </div>
  );
}
