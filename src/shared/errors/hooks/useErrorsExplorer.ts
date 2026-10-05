import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { useAppStore } from "@app/store/appStore";
import { useCursorPager } from "@shared/search/hooks/useCursorPager";
import { useExplorerQuery, useExplorerSubQuery } from "@shared/search/hooks/useExplorerQuery";
import { useExplorerState } from "@shared/search/hooks/useExplorerState";
import type { ExplorerFilter } from "@shared/search/types/filters";
import { toFacetGroups } from "@shared/search/utils/facetGroups";

import {
  queryErrorFacets,
  queryErrorGroups,
  queryErrorOverview,
} from "@shared/errors/api/errorsExplorerApi";
import type { ErrorGroupsPage } from "@shared/errors/api/types";

const PAGE_SIZE = 25;
const NO_INCLUDES = [] as const;
const EMPTY_FILTERS: readonly ExplorerFilter[] = [];

interface UseErrorsExplorerArgs {
  /** Always-applied scope (e.g. a service lock) merged ahead of URL filters. */
  readonly baseFilters?: readonly ExplorerFilter[];
  /** The service-scoped tab has no facet rail and skips the extra query. */
  readonly includeFacets?: boolean;
}

/**
 * The one data path behind both errors surfaces: the standalone Error
 * Tracking explorer and the service-scoped Errors tab. Filters and cursor
 * live in the URL (`useExplorerState`); the paginated issue list, the facet
 * rail and the KPI/volume overview are three parallel reads of the same
 * filtered error-span set.
 */
export function useErrorsExplorer(args: UseErrorsExplorerArgs = {}) {
  const includeFacets = args.includeFacets ?? true;
  const baseFilters = args.baseFilters ?? EMPTY_FILTERS;
  const navigate = useNavigate();
  const setCustomTimeRange = useAppStore((s) => s.setCustomTimeRange);

  const state = useExplorerState();
  const filters = useMemo<readonly ExplorerFilter[]>(
    () => (baseFilters.length > 0 ? [...baseFilters, ...state.filters] : state.filters),
    [baseFilters, state.filters]
  );

  const groupsQuery = useExplorerQuery<ErrorGroupsPage>({
    scope: "errors",
    filters,
    cursor: state.cursor,
    limit: PAGE_SIZE,
    include: NO_INCLUDES,
    fetcher: queryErrorGroups,
  });

  const facetsQuery = useExplorerSubQuery({
    scope: "errors",
    subKey: "facets",
    filters,
    enabled: includeFacets,
    fetcher: queryErrorFacets,
  });

  const overviewQuery = useExplorerSubQuery({
    scope: "errors",
    subKey: "overview",
    filters,
    fetcher: queryErrorOverview,
  });

  const pager = useCursorPager(state, groupsQuery.data?.nextCursor);

  const onOpenGroup = (groupId: string) =>
    navigate({ to: `/errors/${encodeURIComponent(groupId)}` });
  const onTimeRangeChange = (fromMs: number, toMs: number) =>
    setCustomTimeRange(fromMs, toMs, "Brush");

  return {
    state,
    groups: groupsQuery.data?.groups ?? [],
    groupsError: groupsQuery.error as Error | null,
    isPending: groupsQuery.isPending && !groupsQuery.data,
    summary: overviewQuery.data?.summary,
    trend: overviewQuery.data?.trend,
    overviewError: overviewQuery.error as Error | null,
    refetchOverview: overviewQuery.refetch,
    facetGroups: toFacetGroups(facetsQuery.data),
    onOpenGroup,
    onTimeRangeChange,
    startTime: groupsQuery.startTime,
    endTime: groupsQuery.endTime,
    ...pager,
  };
}
