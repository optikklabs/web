import { type ServiceHealth, classifyServiceHealth } from "@/features/services/utils/serviceHealth";
import type {
  RedServiceRow,
  RequestRateSeries,
  ServiceCatalogRedSummary,
} from "@shared/api/red/redApi";

export interface CatalogRow {
  readonly serviceName: string;
  readonly requestCount: number;
  readonly errorCount: number;
  readonly errorRate: number;
  readonly rps: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly p99DeltaPct: number | null;
  readonly status: ServiceHealth;
  readonly sparkline: number[];
  /** Empty when the service does not report it. */
  readonly version: string;
  readonly environment: string;
  readonly instances: number;
}

function deltaPct(now: number, prev: number | undefined): number | null {
  if (prev == null || prev === 0) return null;
  return (now - prev) / prev;
}

function bySparkline(data: RequestRateSeries | undefined): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const s of data?.series ?? []) out.set(s.serviceName, [...s.rps]);
  return out;
}

function byPrevP99(prev: ServiceCatalogRedSummary | undefined): Map<string, number> {
  const m = new Map<string, number>();
  if (!prev) return m;
  for (const row of prev.services) m.set(row.serviceName, row.p99Latency);
  return m;
}

export interface BuildCatalogInputs {
  readonly primary: ServiceCatalogRedSummary;
  readonly comparison?: ServiceCatalogRedSummary;
  readonly rateSeries: RequestRateSeries | undefined;
  readonly windowSec: number;
}

function buildCatalogRow(
  row: RedServiceRow,
  windowSec: number,
  spark: Map<string, number[]>,
  prevP99: Map<string, number>
): CatalogRow {
  const errorRate = row.requestCount > 0 ? (row.errorCount * 100) / row.requestCount : 0;

  return {
    serviceName: row.serviceName,
    requestCount: row.requestCount,
    errorCount: row.errorCount,
    errorRate,
    rps: windowSec > 0 ? row.requestCount / windowSec : 0,
    p50Ms: row.p50Latency,
    p95Ms: row.p95Latency,
    p99Ms: row.p99Latency,
    p99DeltaPct: deltaPct(row.p99Latency, prevP99.get(row.serviceName)),
    status: classifyServiceHealth(errorRate, row.p99Latency),
    sparkline: spark.get(row.serviceName) ?? [],
    version: row.version,
    environment: row.environment,
    instances: row.instances,
  };
}

export function buildCatalogRows(inputs: BuildCatalogInputs): CatalogRow[] {
  const spark = bySparkline(inputs.rateSeries);
  const prevP99 = byPrevP99(inputs.comparison);
  return inputs.primary.services.map((row) =>
    buildCatalogRow(row, inputs.windowSec, spark, prevP99)
  );
}
