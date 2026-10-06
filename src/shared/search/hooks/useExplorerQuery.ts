import { useResolvedTimeBounds } from "@app/store/appStore";
import { useStandardQuery } from "@shared/hooks/useStandardQuery";
import { useSearch } from "@tanstack/react-router";
import { useMemo } from "react";

import type { ExplorerFilter, ExplorerScope } from "../types/filters";
import type { ExplorerIncludeFlag, ExplorerQueryRequest } from "../types/queries";

interface UseExplorerQueryArgs<TResponse> {
  readonly scope: ExplorerScope;
  readonly filters: readonly ExplorerFilter[];
  readonly cursor: string | null;
  readonly limit: number;
  readonly include: readonly ExplorerIncludeFlag[];
  readonly enabled?: boolean;
  readonly fetcher: (body: ExplorerQueryRequest) => Promise<TResponse>;
}

/** The router parses numeric params to numbers; relative values stay strings. */
function toEpochMs(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value !== "") return Number(value);
  return undefined;
}

/** URL bounds (from/to) override the store-resolved bounds when present. */
function useExplorerBounds(): { startTime: number; endTime: number } {
  const bounds = useResolvedTimeBounds();
  // Runs on /logs, /traces and the service-detail tabs: route-agnostic read.
  const search = useSearch({ strict: false }) as { from?: unknown; to?: unknown };

  const urlFrom = toEpochMs(search.from);
  const urlTo = toEpochMs(search.to);
  const hasUrlBounds =
    urlFrom !== undefined &&
    urlTo !== undefined &&
    Number.isFinite(urlFrom) &&
    Number.isFinite(urlTo) &&
    urlFrom > 0 &&
    urlTo > urlFrom;

  if (hasUrlBounds) {
    return { startTime: urlFrom, endTime: urlTo };
  }
  return bounds;
}

export function useExplorerQuery<TResponse>(args: UseExplorerQueryArgs<TResponse>) {
  const { startTime, endTime } = useExplorerBounds();

  const query = useStandardQuery<TResponse>({
    queryKey: [
      args.scope,
      "explorer",
      "query",
      `${startTime}-${endTime}`,
      JSON.stringify(args.filters),
      args.cursor,
      args.limit,
      args.include.join(","),
    ],
    queryFn: () => {
      return args.fetcher({
        startTime,
        endTime,
        filters: args.filters,
        cursor: args.cursor ?? undefined,
        limit: args.limit,
        include: args.include,
      });
    },
    enabled: args.enabled ?? true,
  });

  return { ...query, startTime, endTime };
}

export interface UseExplorerSubQueryArgs<TResponse> {
  readonly scope: ExplorerScope;
  readonly subKey: string;
  readonly filters: readonly ExplorerFilter[];
  readonly enabled?: boolean;
  readonly fetcher: (req: {
    startTime: number;
    endTime: number;
    filters: readonly ExplorerFilter[];
  }) => Promise<TResponse>;
}

export function useExplorerSubQuery<TResponse>(args: UseExplorerSubQueryArgs<TResponse>) {
  const { startTime, endTime } = useExplorerBounds();
  const filtersKey = useMemo(() => JSON.stringify(args.filters), [args.filters]);

  return useStandardQuery<TResponse>({
    queryKey: [args.scope, "explorer", args.subKey, `${startTime}-${endTime}`, filtersKey],
    queryFn: () => {
      return args.fetcher({
        startTime,
        endTime,
        filters: args.filters,
      });
    },
    enabled: args.enabled ?? true,
  });
}
