import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import {
  type QueryDetailSummary,
  type QueryExecutionRow,
  type QueryTimeseriesPoint,
  getQueryDetailExecutions,
  getQueryDetailSummary,
  getQueryDetailTimeseries,
} from "@/features/saturation/api/databaseQueryDetailApi";
import type { DatabaseFilters } from "@/features/saturation/api/databaseSlowQueriesApi";

function scopeKeys(hash: string, filters: DatabaseFilters) {
  return [hash, filters.dbSystem, filters.collection];
}

export function useQueryDetailSummary(hash: string, filters: DatabaseFilters, enabled: boolean) {
  return useTimeRangeQuery<QueryDetailSummary | null>(
    "saturation-db.query-summary",
    (s, e) => getQueryDetailSummary(hash, s, e, filters),
    { extraKeys: scopeKeys(hash, filters), enabled }
  );
}

export function useQueryDetailTimeseries(hash: string, filters: DatabaseFilters, enabled: boolean) {
  return useTimeRangeQuery<QueryTimeseriesPoint[]>(
    "saturation-db.query-timeseries",
    (s, e) => getQueryDetailTimeseries(hash, s, e, filters),
    { extraKeys: scopeKeys(hash, filters), enabled }
  );
}

export function useQueryDetailExecutions(hash: string, filters: DatabaseFilters, enabled: boolean) {
  return useTimeRangeQuery<QueryExecutionRow[]>(
    "saturation-db.query-executions",
    (s, e) => getQueryDetailExecutions(hash, s, e, filters),
    { extraKeys: scopeKeys(hash, filters), enabled }
  );
}
