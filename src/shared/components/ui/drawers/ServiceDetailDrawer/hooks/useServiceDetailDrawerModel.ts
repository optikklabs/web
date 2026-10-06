import { useLocation, useNavigate } from "@tanstack/react-router";

import { ROUTES } from "@/shared/constants/routes";

import {
  buildServiceLogsSearch,
  buildServiceTracesSearch,
} from "@shared/components/ui/drawers/serviceDrawerState";
import { endpointMethod } from "@shared/utils/endpointMethod";
import type { ServiceSummarySnapshot } from "../types";
import {
  buildDependencyRows,
  buildErrorTrendSeries,
  buildLatencyTrendSeries,
  buildRequestTrendSeries,
} from "../utils";
import { useServiceDrawerQueries } from "./useServiceDrawerQueries";

export function useServiceDetailDrawerModel(serviceName: string, title: string | null | undefined) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    summaryQuery,
    requestTrendQuery,
    errorTrendQuery,
    latencyTrendQuery,
    endpointsQuery,
    dependenciesQuery,
  } = useServiceDrawerQueries(serviceName);

  const row = summaryQuery.summary;
  const summaryMetrics: ServiceSummarySnapshot | null = row
    ? {
        requestCount: row.requestCount,
        errorCount: row.errorCount,
        errorRate: row.errorRate,
        p50Latency: row.p50Ms,
        p95Latency: row.p95Ms,
        p99Latency: row.p99Ms,
      }
    : null;

  const requestTrendSeries = buildRequestTrendSeries(requestTrendQuery.data ?? []);

  const errorTrendSeries = buildErrorTrendSeries(errorTrendQuery.data ?? []);

  const latencyTrendSeries = buildLatencyTrendSeries(latencyTrendQuery.data ?? []);

  const endpointRows = [...(endpointsQuery.data?.data.results ?? [])]
    .sort((left, right) => right.totalCount - left.totalCount)
    .slice(0, 6)
    .map((row, index) => {
      const method = endpointMethod(row);
      return {
        id: `${method ?? ""}:${row.operationName}:${index}`,
        serviceName: row.serviceName,
        operationName: row.operationName,
        endpointName: row.httpRoute,
        httpMethod: method ?? "",
        requestCount: row.totalCount,
        errorCount: row.errorCount,
        p50Latency: row.p50Ms,
        p95Latency: row.p95Ms,
      };
    });

  const upstreamRows = buildDependencyRows(
    dependenciesQuery.data?.edges ?? [],
    serviceName,
    "upstream"
  );

  const downstreamRows = buildDependencyRows(
    dependenciesQuery.data?.edges ?? [],
    serviceName,
    "downstream"
  );

  const openTraces = (): void => {
    navigate({
      to: ROUTES.traces as never,
      search: buildServiceTracesSearch(location.search, serviceName) as never,
    });
  };

  const openLogs = (): void => {
    navigate({
      to: ROUTES.logs as never,
      search: buildServiceLogsSearch(location.search, serviceName) as never,
    });
  };

  const openFullView = (): void => {
    const path = ROUTES.serviceDetail.replace("$serviceName", encodeURIComponent(serviceName));
    navigate({ to: path as string & {}, search: location.search as never });
  };

  const serviceLabel = title?.trim() || serviceName;
  const endpointsLoading = endpointsQuery.isLoading && endpointRows.length === 0;
  const dependenciesLoading =
    dependenciesQuery.isLoading && upstreamRows.length === 0 && downstreamRows.length === 0;

  return {
    summaryQuery,
    requestTrendQuery,
    errorTrendQuery,
    latencyTrendQuery,
    endpointsQuery,
    dependenciesQuery,
    summaryMetrics,
    requestTrendSeries,
    errorTrendSeries,
    latencyTrendSeries,
    endpointRows,
    upstreamRows,
    downstreamRows,
    openTraces,
    openLogs,
    openFullView,
    serviceLabel,
    endpointsLoading,
    dependenciesLoading,
  };
}
