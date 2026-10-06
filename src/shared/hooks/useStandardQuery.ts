import {
  type QueryFunction,
  type UseQueryOptions,
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";

import { useTenantId } from "@app/store/appStore";
import { type ApiErrorShape, toApiErrorShape } from "@shared/api/utils/errorNormalization";

/**
 * Query key convention (all data queries):
 *   [domain..., params...] + [tenantId]  (tenantId appended here)
 *
 * - tenantId is appended as the LAST element by the wrapper, so feature
 *   code keeps invalidating by domain prefix (e.g. ["llm", "prompts"]).
 * - Queries stay disabled while no tenant is selected (the logout window),
 *   so features never check the tenant themselves.
 * - Refresh is invalidation (useAppRefreshSubscriber), never a key part.
 * - Time bounds in keys come from the store (useResolvedTimeBounds),
 *   resolved once per user action — never Date.now() during render.
 */

/** Shared retry policy: never retry 4xx (client/budget errors). */
export function retryUnlessClientError(failureCount: number, error: unknown): boolean {
  const { status } = toApiErrorShape(error);
  if (status >= 400 && status < 500) return false;
  return failureCount < 2;
}

export function useStandardQuery<T>(
  options: Omit<UseQueryOptions<T, ApiErrorShape, T>, "queryKey" | "queryFn"> & {
    queryKey: readonly unknown[];
    queryFn: QueryFunction<T, readonly unknown[]>;
  }
) {
  const tenantId = useTenantId();
  return useQuery({
    placeholderData: keepPreviousData,
    staleTime: 5_000,
    retry: retryUnlessClientError,
    ...options,
    queryKey: [...options.queryKey, tenantId],
    enabled: tenantId !== null && options.enabled !== false,
  });
}
