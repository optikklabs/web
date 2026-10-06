/**
 * staleTime for Overview queries. Overview data is rarely worth refetching on
 * navigation; a 5-minute window keeps the UX snappy. `triggerRefresh()` still
 * forces invalidation for explicit refresh.
 */
export const OVERVIEW_QUERY_STALE_MS = 5 * 60_000;
