import { useEffect, useRef, useState } from "react";

import type { ExplorerStateApi } from "./useExplorerState";

/**
 * Forward/back paging over an opaque backend cursor kept in the URL.
 *
 * The API only hands out the *next* cursor, so stepping back means
 * remembering the cursors already visited. Changing the filters invalidates
 * that trail and returns to page one.
 */
export function useCursorPager(
  state: ExplorerStateApi,
  nextCursor: string | null | undefined,
  resetKey?: unknown
) {
  const [history, setHistory] = useState<string[]>([]);
  const { cursor, setCursor, filters } = state;

  const filtersKey = JSON.stringify([filters, resetKey]);
  // A cursor arriving in the URL belongs to the filters it shipped with, so
  // only a *change* of filters resets paging — never the first render.
  const lastFiltersKey = useRef(filtersKey);
  useEffect(() => {
    if (lastFiltersKey.current === filtersKey) return;
    lastFiltersKey.current = filtersKey;
    setHistory([]);
    setCursor(null);
  }, [filtersKey, setCursor]);

  const onNextPage = () => {
    if (!nextCursor) return;
    setHistory((prev) => [...prev, cursor ?? ""]);
    setCursor(nextCursor);
  };

  const onPrevPage = () => {
    setHistory((prev) => {
      const next = [...prev];
      const previous = next.pop();
      if (previous !== undefined) setCursor(previous === "" ? null : previous);
      return next;
    });
  };

  return {
    onNextPage,
    onPrevPage,
    hasNextPage: Boolean(nextCursor),
    hasPrevPage: history.length > 0,
  };
}
