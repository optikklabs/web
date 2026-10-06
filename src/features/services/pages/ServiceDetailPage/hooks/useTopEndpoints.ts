import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import type { PaginatedResponse } from "@/shared/api/service-types";
import { type TopEndpoint, getTopEndpoints } from "@shared/api/red/redApi";

export interface EndpointWithDelta extends TopEndpoint {
  readonly p99DeltaPct: number | null;
}

function buildDelta(now: TopEndpoint, prev: TopEndpoint | undefined): number | null {
  if (!prev || !prev.p99Ms) return null;
  return (now.p99Ms - prev.p99Ms) / prev.p99Ms;
}

export function useTopEndpoints(serviceName: string, limit = 50, cursor?: string) {
  return useTimeRangeQuery<PaginatedResponse<EndpointWithDelta[]>>(
    "service-detail.top-endpoints",
    async (start, end): Promise<PaginatedResponse<EndpointWithDelta[]>> => {
      const payload = await getTopEndpoints(
        start,
        end,
        serviceName,
        limit,
        "previous_period",
        cursor
      );
      const primary = payload.data.results;
      const previousByOp = new Map<string, TopEndpoint>();
      for (const row of payload.comparison?.results ?? []) {
        previousByOp.set(row.operationName, row);
      }
      const results = primary.map((row) => ({
        ...row,
        p99DeltaPct: buildDelta(row, previousByOp.get(row.operationName)),
      }));
      return {
        results,
        pageInfo: payload.data.pageInfo,
      };
    },
    { extraKeys: [serviceName, limit, cursor], enabled: Boolean(serviceName) }
  );
}
