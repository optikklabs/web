import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useRef } from "react";

import {
  type QueryPatternsPage,
  buildDatabaseQueryBody,
  queryDatabasePatterns,
} from "@/features/saturation/api/databaseQueriesExplorerApi";
import type { SlowQueryPatternRow } from "@/features/saturation/api/databaseSlowQueriesApi";
import { DatabaseQueriesTable } from "@/features/saturation/pages/SaturationDatabasePage/list/DatabaseQueriesTable";
import { ROUTES } from "@/shared/constants/routes";
import { ExplorerHeader } from "@shared/search/components/chrome/ExplorerHeader";
import { ExplorerLayout } from "@shared/search/components/chrome/ExplorerLayout";
import { ExplorerTableFooter } from "@shared/search/components/chrome/ExplorerTableFooter";
import { SearchTranslationNotice } from "@shared/search/components/chrome/SearchTranslationNotice";
import { useCursorPager } from "@shared/search/hooks/useCursorPager";
import { useExplorerKeyboard } from "@shared/search/hooks/useExplorerKeyboard";
import { useExplorerQuery } from "@shared/search/hooks/useExplorerQuery";
import { useExplorerState } from "@shared/search/hooks/useExplorerState";
import type { ExplorerFilter } from "@shared/search/types/filters";

const PAGE_SIZE = 25;
const NO_INCLUDES = [] as const;

interface DatabaseQueriesExplorerProps {
  readonly dbSystem?: string;
  readonly embedded?: boolean;
  readonly actions?: ReactNode;
}

export function DatabaseQueriesExplorer({
  dbSystem,
  embedded = false,
  actions,
}: DatabaseQueriesExplorerProps) {
  const navigate = useNavigate();
  const state = useExplorerState();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filters: readonly ExplorerFilter[] = dbSystem
    ? [...state.filters, { field: "dbSystem", op: "eq", value: dbSystem }]
    : state.filters;
  const query = useExplorerQuery<QueryPatternsPage>({
    scope: "database-queries",
    filters,
    cursor: state.cursor,
    limit: PAGE_SIZE,
    include: NO_INCLUDES,
    fetcher: queryDatabasePatterns,
  });
  const rows = query.data?.rows ?? [];
  const pager = useCursorPager(state, query.data?.nextCursor);
  const warnings = buildDatabaseQueryBody({
    startTime: query.startTime,
    endTime: query.endTime,
    filters,
    cursor: state.cursor ?? undefined,
    limit: PAGE_SIZE,
  }).warnings;

  const onOpen = (row: SlowQueryPatternRow) => {
    navigate({
      to: ROUTES.databaseQuery.replace("$queryId", row.queryHash) as never,
      search: {
        dbSystem: row.dbSystem || dbSystem || undefined,
        collection: row.collectionName || undefined,
      } as never,
    });
  };

  useExplorerKeyboard({ onSearchFocus: () => searchInputRef.current?.focus() });

  return (
    <ExplorerLayout
      embedded={embedded}
      header={
        <>
          <ExplorerHeader
            ref={searchInputRef}
            scope="database-queries"
            filters={state.filters}
            onChangeFilters={state.setFilters}
            searchPlaceholder={
              dbSystem
                ? 'Search this system: p99Ms:>=500 "select users"'
                : 'Search queries: dbSystem:postgresql p99Ms:>=500 "select users"'
            }
            actions={actions}
            sticky={!embedded}
          />
          <SearchTranslationNotice warnings={warnings} />
        </>
      }
      content={
        <div className="flex flex-col">
          {query.error ? (
            <div
              className="mb-4 flex items-center justify-between gap-3 rounded-md border border-error bg-error-subtle px-3 py-2 text-error text-sm"
              role="alert"
            >
              <span>Could not load database queries: {query.error.message}</span>
              <button
                type="button"
                className="shrink-0 font-medium text-primary hover:underline"
                onClick={() => void query.refetch()}
              >
                Retry
              </button>
            </div>
          ) : null}

          <DatabaseQueriesTable
            rows={rows}
            loading={query.isPending && !query.data}
            emptyText={
              dbSystem
                ? "No queries match the current filters for this system."
                : "No queries match the current filters."
            }
            onOpen={onOpen}
          />
          <ExplorerTableFooter
            rowCount={rows.length}
            noun={rows.length === 1 ? "query" : "queries"}
            onNextPage={pager.onNextPage}
            onPrevPage={pager.onPrevPage}
            hasNextPage={pager.hasNextPage}
            hasPrevPage={pager.hasPrevPage}
          />
        </div>
      }
    />
  );
}
