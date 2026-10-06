import { useStandardQuery } from "@shared/hooks/useStandardQuery";

const HOUR_MS = 60 * 60 * 1000;

/**
 * `useStandardQuery` for data that never changes once fetched (a specific
 * trace's spans, logs, critical path). Re-opening the same trace in the
 * session is a pure cache hit — no re-fetch, no spinner. A reload clears it.
 */
export function useImmutableQuery<T>(options: Parameters<typeof useStandardQuery<T>>[0]) {
  return useStandardQuery<T>({
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: HOUR_MS,
    ...options,
  });
}
