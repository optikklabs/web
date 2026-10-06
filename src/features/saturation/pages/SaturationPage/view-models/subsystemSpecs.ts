import { ROUTES } from "@/shared/constants/routes";
import { formatDuration, formatNumber, formatPercentage } from "@shared/utils/formatters";

import type { DatastoreSystemRow } from "../../../api/datastoresExplorerSchemas";
import type { KafkaSummary } from "../../../api/kafkaExplorerSchemas";
import { type DatastoreSummary, summarizeDatastores } from "./datastoreSummary";

import { type Tone, toneFromHealth } from "./saturationScore";

export type SubsystemCardSpec = {
  id: "kafka" | "database" | "redis";
  label: string;
  href: string;
  sub: string;
  tone: Tone;
  statusText: string;
  primary: string;
  secondary: string;
  iconName: "kafka" | "db" | "cache";
};

const SUBSYSTEM_ROUTES: Record<SubsystemCardSpec["id"], string> = {
  kafka: ROUTES.saturationKafkaOverview,
  database: ROUTES.database,
  redis: ROUTES.saturation,
};

function chipStatus(tone: Tone, count: number, what: string): string {
  if (tone === "ok") return "healthy";
  if (tone === "err") return `${count} ${what} hot`;
  return `${count} ${what} elevated`;
}

export function buildKafkaCardSpec(summary: KafkaSummary | undefined): SubsystemCardSpec {
  const mps = summary?.messagesPerSec ?? 0;
  const topics = summary?.topicCount ?? 0;
  const groups = summary?.groupCount ?? 0;
  const hasData = summary !== undefined && (mps > 0 || topics > 0 || groups > 0);
  return {
    id: "kafka",
    label: "Kafka",
    href: SUBSYSTEM_ROUTES.kafka,
    sub: `${formatNumber(topics)} topics · ${formatNumber(groups)} groups`,
    tone: hasData ? "ok" : "neutral",
    statusText: hasData ? "streaming" : "no data",
    primary: `${formatNumber(mps)} msg/s traffic`,
    secondary: `${formatNumber(summary?.assignedPartitions ?? 0)} partitions assigned`,
    iconName: "kafka",
  };
}

function categorizedRows(rows: DatastoreSystemRow[], category: string) {
  return rows.filter((row) => row.category === category);
}

function reduceCategory(rows: DatastoreSystemRow[]) {
  const summary = summarizeDatastores(rows);
  return {
    qps: summary.queryCount,
    p95: summary.p95LatencyMs,
    errorRate: summary.errorRate,
    conns: summary.activeConnections,
    slow: rows.filter((row) => row.p95LatencyMs >= 100).length,
  };
}

function categoryCardSpec(
  id: "database" | "redis",
  label: string,
  rows: DatastoreSystemRow[]
): SubsystemCardSpec {
  const stats = reduceCategory(rows);
  const hasData = rows.length > 0;
  const tone = hasData ? toneFromHealth(stats.p95, stats.errorRate) : "neutral";
  const what = id === "database" ? "instance" : "shard";
  return {
    id,
    label,
    href: SUBSYSTEM_ROUTES[id],
    sub: `${formatNumber(rows.length)} systems · ${formatNumber(stats.conns)} conns`,
    tone,
    statusText: hasData ? chipStatus(tone, stats.slow, what) : "no data",
    primary: `${formatNumber(stats.qps)} qps · ${formatDuration(stats.p95)} p95`,
    secondary: `${formatPercentage(stats.errorRate, 2)} errors`,
    iconName: id === "database" ? "db" : "cache",
  };
}

export function buildDatabaseCardSpec(rows: DatastoreSystemRow[]): SubsystemCardSpec {
  return categoryCardSpec("database", "Database", categorizedRows(rows, "database"));
}

export type OverviewSummary = {
  totalSystems: number;
  totalQueries: number;
  p95LatencyMs: number;
  errorRate: number;
  tone: Tone;
  statusText: string;
  subline: string;
};

export function buildOverviewSummary(
  ds: DatastoreSummary | undefined,
  kafka: KafkaSummary | undefined
): OverviewSummary {
  const totalSystems = ds?.totalSystems ?? 0;
  const totalQueries = ds?.queryCount ?? 0;
  const p95 = ds?.p95LatencyMs ?? 0;
  const err = ds?.errorRate ?? 0;
  const hasData = ds !== undefined || kafka !== undefined;
  const tone = hasData ? toneFromHealth(p95, err) : "neutral";
  const subsystemCount = (totalSystems > 0 ? 2 : 0) + (kafka?.topicCount ? 1 : 0);
  const statusText = !hasData
    ? "no data"
    : tone === "ok"
      ? "healthy"
      : tone === "warn"
        ? "elevated latency"
        : "degraded";
  return {
    totalSystems,
    totalQueries,
    p95LatencyMs: p95,
    errorRate: err,
    tone,
    statusText,
    subline: `${formatNumber(totalSystems)} datastores · ${subsystemCount} subsystems · ${formatNumber(totalQueries)} ops in range`,
  };
}
