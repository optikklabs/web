import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

import type { ExplorerFilter, ExplorerMode } from "../types/filters";
import { asUrlParamString, decodeFilters, encodeFilters, parseMode } from "../utils/urlState";

interface ExplorerStateSnapshot {
  readonly filters: readonly ExplorerFilter[];
  readonly mode: ExplorerMode;
  readonly cursor: string | null;
  readonly detail: string | null;
}

export interface ExplorerStateApi extends ExplorerStateSnapshot {
  readonly setFilters: (filters: readonly ExplorerFilter[]) => void;
  readonly addFilter: (filter: ExplorerFilter) => void;
  readonly removeFilter: (filter: ExplorerFilter) => void;
  readonly setMode: (mode: ExplorerMode) => void;
  readonly setCursor: (cursor: string | null) => void;
  readonly setDetail: (detail: string | null) => void;
  readonly clearAll: () => void;
}

/** Patch of the explorer params; `undefined` removes a param from the URL. */
type ExplorerSearchPatch = Partial<Record<"filters" | "mode" | "cursor" | "detail", string>>;

export function useExplorerState(): ExplorerStateApi {
  // Shared by /logs, /traces and the service-detail logs/traces tabs, so it
  // reads search route-agnostically; each hosting route validates these
  // params (see pickExplorerSearch).
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate();

  const rawFilters = asUrlParamString(search.filters);
  const filters = useMemo(() => decodeFilters(rawFilters), [rawFilters]);
  const mode = parseMode(asUrlParamString(search.mode));
  const cursor = asUrlParamString(search.cursor) ?? null;
  const detail = asUrlParamString(search.detail) ?? null;

  const patchSearch = useCallback(
    (patch: ExplorerSearchPatch) => {
      navigate({
        search: ((prev: Record<string, unknown>) => ({ ...prev, ...patch })) as never,
        replace: true,
      });
    },
    [navigate]
  );

  const setFilters = (next: readonly ExplorerFilter[]) => {
    patchSearch({ filters: next.length > 0 ? encodeFilters(next) : undefined });
  };
  const addFilter = (filter: ExplorerFilter) => {
    setFilters([...filters, filter]);
  };
  const removeFilter = (filter: ExplorerFilter) => {
    setFilters(
      filters.filter(
        (f) => f.field !== filter.field || f.op !== filter.op || f.value !== filter.value
      )
    );
  };
  const setMode = (next: ExplorerMode) =>
    patchSearch({ mode: (next as string) === "analytics" ? "analytics" : undefined });
  const setCursor = useCallback(
    (next: string | null) => patchSearch({ cursor: next ?? undefined }),
    [patchSearch]
  );
  const setDetail = (next: string | null) => patchSearch({ detail: next ?? undefined });
  const clearAll = () => {
    patchSearch({
      filters: undefined,
      mode: undefined,
      cursor: undefined,
      detail: undefined,
    });
  };

  return {
    filters,
    mode,
    cursor,
    detail,
    setFilters,
    addFilter,
    removeFilter,
    setMode,
    setCursor,
    setDetail,
    clearAll,
  };
}
