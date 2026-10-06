import { useMemo } from "react";

import { useTimeRange, useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import {
  type Comparable,
  type RequestRateSeries,
  type ServiceCatalogRedSummary,
  getRedSummaryWithComparison,
  getRequestRateSeries,
} from "@shared/api/red/redApi";

import { type CatalogRow, buildCatalogRows } from "../catalog/buildCatalogRows";

export interface UseCatalogListResult {
  readonly rows: CatalogRow[];
  readonly summary?: ServiceCatalogRedSummary;

  readonly comparison?: ServiceCatalogRedSummary;
  readonly windowSec: number;
  readonly isPending: boolean;
  readonly isError: boolean;
}

function useRedSummary() {
  return useTimeRangeQuery<Comparable<ServiceCatalogRedSummary>>(
    "service-hub.red-summary-cmp",
    (s, e, signal) => getRedSummaryWithComparison(s, e, undefined, signal)
  );
}

function useRateSeries() {
  return useTimeRangeQuery<RequestRateSeries>("service-hub.request-rate", (s, e, signal) =>
    getRequestRateSeries(s, e, undefined, signal)
  );
}

export function useCatalogList(): UseCatalogListResult {
  const { getTimeRange } = useTimeRange();
  const summary = useRedSummary();
  const series = useRateSeries();

  const windowSec = useMemo(() => {
    const bounds = getTimeRange();
    return Math.max(1, (Number(bounds.endTime) - Number(bounds.startTime)) / 1000);
  }, [getTimeRange]);

  const rows = useMemo<CatalogRow[]>(() => {
    if (!summary.data) return [];
    return buildCatalogRows({
      primary: summary.data.data,
      comparison: summary.data.comparison,
      rateSeries: series.data,
      windowSec,
    });
  }, [summary.data, series.data, windowSec]);

  return {
    rows,
    summary: summary.data?.data,
    comparison: summary.data?.comparison,
    windowSec,
    isPending: summary.isPending,
    isError: Boolean(summary.error || series.error),
  };
}
