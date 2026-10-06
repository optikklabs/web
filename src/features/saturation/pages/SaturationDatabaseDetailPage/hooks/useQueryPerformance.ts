import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import {
  type QueryPerformanceCatalogue,
  type QueryPerformanceResponse,
  getQueryPerformanceCatalogue,
  getQueryPerformanceSeries,
} from "@/features/saturation/api/databaseQueryPerformanceApi";

export function useQueryPerformanceCatalogue(system: string) {
  return useTimeRangeQuery<QueryPerformanceCatalogue>(
    "saturation-db.query-performance-catalogue",
    (start, end) => getQueryPerformanceCatalogue(system, start, end),
    { extraKeys: [system] }
  );
}

interface QueryPerformanceScope {
  readonly mode: "collection" | "query";
  readonly collection?: string;
  readonly queryHash?: string;
  readonly showAll: boolean;
}

export function useQueryPerformanceSeries(system: string, scope: QueryPerformanceScope) {
  const selected = scope.mode === "collection" ? scope.collection : scope.queryHash;
  return useTimeRangeQuery<QueryPerformanceResponse>(
    "saturation-db.query-performance-series",
    (start, end) => {
      const requestScope =
        scope.mode === "collection"
          ? {
              dbSystem: system,
              collection: scope.collection ?? "",
              limit: scope.showAll ? 100 : 10,
            }
          : { dbSystem: system, queryHash: scope.queryHash ?? "", limit: 1 };
      return getQueryPerformanceSeries(requestScope, start, end);
    },
    {
      extraKeys: [system, scope.mode, selected, scope.showAll],
      enabled: Boolean(selected),
    }
  );
}
