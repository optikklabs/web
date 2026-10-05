import { useMemo, useRef } from "react";

import { ExplorerHeader } from "@shared/search/components/chrome/ExplorerHeader";
import { ExplorerLayout } from "@shared/search/components/chrome/ExplorerLayout";
import { SearchTranslationNotice } from "@shared/search/components/chrome/SearchTranslationNotice";
import { FacetRail } from "@shared/search/components/facets/FacetRail";
import { useExplorerKeyboard } from "@shared/search/hooks/useExplorerKeyboard";

import { buildErrorsFilters } from "@shared/errors/api/buildErrorsFilters";
import { ErrorsExplorerContent } from "@shared/errors/components/ErrorsExplorerContent";
import { useErrorsExplorer } from "@shared/errors/hooks/useErrorsExplorer";

export default function ErrorTrackingPage() {
  const model = useErrorsExplorer();
  const { state } = model;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const translationWarnings = useMemo(
    () => buildErrorsFilters(state.filters, model.startTime, model.endTime).warnings,
    [state.filters, model.startTime, model.endTime]
  );

  const onInclude = (field: string, value: string) => state.addFilter({ field, op: "eq", value });

  useExplorerKeyboard({ onSearchFocus: () => searchInputRef.current?.focus() });

  return (
    <ExplorerLayout
      header={
        <>
          <ExplorerHeader
            ref={searchInputRef}
            scope="errors"
            filters={state.filters}
            onChangeFilters={(f) => state.setFilters(f)}
            searchPlaceholder='Search issues: service:checkout httpStatus:500 "timeout"'
          />
          <SearchTranslationNotice warnings={translationWarnings} />
        </>
      }
      facets={
        <FacetRail
          groups={model.facetGroups}
          onInclude={onInclude}
          activeFilterCount={state.filters.length}
          onClearAll={() => state.clearAll()}
        />
      }
      content={<ErrorsExplorerContent model={model} />}
    />
  );
}
