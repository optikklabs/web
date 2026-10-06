import { useMemo } from "react";

import { getErrorHotspot } from "@/features/overview/api/overviewErrorsApi";
import { OVERVIEW_QUERY_STALE_MS } from "@/features/overview/constants";
import {
  type RedServiceRow,
  type RequestErrorRatePoint,
  getRedSummary,
  getRequestAndErrorRateSeries,
} from "@shared/api/red/redApi";

import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";
import type { UseQueryResult } from "@tanstack/react-query";

export type ServiceHealthStatus = "ok" | "warn" | "err";

export interface ServiceHealthCell {
  readonly name: string;
  readonly requestCount: number;
  readonly errorCount: number;
  readonly errorRate: number;
  readonly p95Latency: number;
  readonly p99Latency: number;
  readonly p50Latency: number;
  readonly status: ServiceHealthStatus;
}

export interface ErrorHotspotRow {
  readonly key: string;
  readonly groupId: string;
  readonly serviceName: string;
  readonly operationName: string;
  readonly errorCount: number;
}

function statusFromRate(rate: number): ServiceHealthStatus {
  if (rate > 5) return "err";
  if (rate > 1) return "warn";
  return "ok";
}

function toCell(row: RedServiceRow): ServiceHealthCell {
  const errorRate = row.requestCount > 0 ? (row.errorCount / row.requestCount) * 100 : 0;
  return {
    name: row.serviceName,
    requestCount: row.requestCount,
    errorCount: row.errorCount,
    errorRate,
    p50Latency: row.p50Latency,
    p95Latency: row.p95Latency,
    p99Latency: row.p99Latency,
    status: statusFromRate(errorRate),
  };
}

export function useOverviewSummaryQuery() {
  return useTimeRangeQuery(
    "overview-summary",
    (start, end, signal) => getRedSummary(start, end, undefined, signal),
    { staleTime: OVERVIEW_QUERY_STALE_MS }
  );
}

export function useSystemPerformanceQuery(): UseQueryResult<RequestErrorRatePoint[]> {
  return useTimeRangeQuery<RequestErrorRatePoint[]>(
    "overview-performance",
    (start, end, signal) => getRequestAndErrorRateSeries(start, end, undefined, signal),
    { staleTime: OVERVIEW_QUERY_STALE_MS }
  );
}

export function useTopErrorsQuery(enabled = true): UseQueryResult<ErrorHotspotRow[]> {
  return useTimeRangeQuery<ErrorHotspotRow[]>(
    "overview-top-errors",
    async (start, end, signal) => {
      const rows = await getErrorHotspot(start, end, signal);
      return rows.map((r) => ({ ...r, key: `${r.serviceName}::${r.groupId}` }));
    },
    { staleTime: OVERVIEW_QUERY_STALE_MS, enabled }
  );
}

export function useServiceHealthCells(
  rows: readonly RedServiceRow[] | undefined
): readonly ServiceHealthCell[] {
  return useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return rows
      .map(toCell)
      .filter((c) => c.name)
      .sort((a, b) => b.requestCount - a.requestCount);
  }, [rows]);
}

export function useRankedErrorRows(
  rows: readonly ErrorHotspotRow[] | undefined,
  limit = 6
): readonly ErrorHotspotRow[] {
  return useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return [...rows]
      .filter((r) => r.errorCount > 0)
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, limit);
  }, [rows, limit]);
}
