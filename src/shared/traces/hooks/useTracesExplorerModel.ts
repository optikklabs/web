import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { useAppStore, useResolvedTimeBounds, useTimeRange } from "@app/store/appStore";
import { useCursorPager } from "@shared/search/hooks/useCursorPager";
import type { ExplorerFilter } from "@shared/search/types/filters";
import type { ExplorerIncludeFlag } from "@shared/search/types/queries";
import { toTrendBuckets } from "@shared/search/utils/trend";

import type { TraceSummary } from "@shared/api/traces/types";
import { sortTraces } from "../utils/sortTraces";
import { useTracesExplorer } from "./useTracesExplorer";

interface UseTracesExplorerModelArgs {
  readonly baseFilters?: readonly ExplorerFilter[];
  readonly includeFacets?: boolean;
}

export function useTracesExplorerModel(args: UseTracesExplorerModelArgs = {}) {
  const includeFacets = args.includeFacets ?? true;
  const include = useMemo<readonly ExplorerIncludeFlag[]>(
    () => (includeFacets ? ["summary", "facets", "trend"] : ["summary", "trend"]),
    [includeFacets]
  );

  const explorer = useTracesExplorer({ include, baseFilters: args.baseFilters });
  const { state, query, facetsQuery, trendQuery, traces, facets, summary, trend } = explorer;

  const navigate = useNavigate();

  const setCustomTimeRange = useAppStore((s) => s.setCustomTimeRange);
  const timeRange = useTimeRange();
  const { startTime, endTime } = useResolvedTimeBounds();

  const trendBuckets = useMemo(() => toTrendBuckets(trend), [trend]);
  const sortedTraces = sortTraces(traces, "recent");

  const onTimeRangeChange = (fromMs: number, toMs: number) =>
    setCustomTimeRange(fromMs, toMs, "Brush");

  const onOpenTrace = (trace: TraceSummary) => {
    navigate({ to: `/traces/${encodeURIComponent(trace.traceId)}` });
  };

  const pager = useCursorPager(state, query.data?.nextCursor);

  return {
    state,
    query,
    facetsQuery,
    trendQuery,
    facets,
    summary,
    trendBuckets,
    sortedTraces,
    onOpenTrace,
    onTimeRangeChange,
    ...pager,
    zoomed: timeRange.kind === "absolute",
    startTime,
    endTime,
  };
}
