import { useRef } from "react";

import { useExplorerKeyboard } from "@shared/search/hooks/useExplorerKeyboard";
import { toFacetGroups } from "@shared/search/utils/facetGroups";

import { useTracesExplorerModel } from "@shared/traces/hooks/useTracesExplorerModel";

export function useTracesExplorerPage() {
  const model = useTracesExplorerModel({ includeFacets: true });
  const { state, facets } = model;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const facetGroups = toFacetGroups(facets);

  const onInclude = (field: string, value: string) => state.addFilter({ field, op: "eq", value });
  const onExclude = (field: string, value: string) => state.addFilter({ field, op: "neq", value });
  const onClearFilters = () => state.clearAll();

  useExplorerKeyboard({
    onSearchFocus: () => searchInputRef.current?.focus(),
  });

  return {
    model,
    state,
    facetGroups,
    searchInputRef,
    onInclude,
    onExclude,
    onClearFilters,
    startTime: model.startTime,
    endTime: model.endTime,
  };
}
