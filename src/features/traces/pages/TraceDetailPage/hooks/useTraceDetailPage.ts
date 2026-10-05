import { useCallback, useMemo } from "react";

import { useTracesStore } from "../../../store/tracesStore";

import { useTraceDetailActions } from "./useTraceDetailActions";
import { useTraceDetailHotkeys } from "./useTraceDetailHotkeys";
import { useTraceDetailState } from "./useTraceDetailState";

import type { TraceDetailLayoutProps } from "@shared/traces/components/detail/TraceDetailLayout";

export function useTraceDetailPage() {
  const state = useTraceDetailState();
  const actions = useTraceDetailActions({
    resolvedTraceId: state.resolvedTraceId,
    setSelectedSpanId: state.data.setSelectedSpanId,
    selectedSpanId: state.data.selectedSpanId,
    traceTimeBounds: state.traceTimeBounds,
  });

  const setVisualizationTab = useTracesStore((s) => s.setVisualizationTab);

  const errorSpanIds = useMemo(
    () => Array.from(state.data.errorPathSpanIds),
    [state.data.errorPathSpanIds]
  );
  const onSelectSpan = useCallback(
    (id: string) => actions.handleSpanClick({ spanId: id }),
    [actions]
  );

  useTraceDetailHotkeys({
    traceId: state.resolvedTraceId,
    spans: state.data.spans,
    errorSpanIds,
    selectedSpanId: state.data.selectedSpanId,
    onSelectSpan,
    onCloseSpan: actions.closeSpan,
    onSetViz: setVisualizationTab,
  });

  const layoutProps: Omit<TraceDetailLayoutProps, "traceId" | "errorCount"> = {
    activeTab: state.activeTab,
    onActiveTabChange: state.setActiveTab,
    spans: state.data.spans,
    selectedSpanId: state.data.selectedSpanId,
    selectedSpan: state.data.selectedSpan ?? null,
    onSpanClick: actions.handleSpanClick,
    onCloseSpan: actions.closeSpan,
    criticalPathSpanIds: state.data.criticalPathSpanIds,
    errorPathSpanIds: state.data.errorPathSpanIds,
    serviceMap: state.serviceMap.data ?? null,
    errorGroups: state.data.errorGroups,
    spanAttributes: state.data.spanAttributes,
    spanAttributesLoading: state.data.spanAttributesLoading,
    spanEvents: state.data.spanEvents,
    traceLogs: state.data.traceLogs,
    relatedTraces: state.data.relatedTraces,
    relatedTracesRequested: state.data.relatedTracesRequested,
    relatedTracesLoading: state.data.relatedTracesLoading,
    onLoadRelatedTraces: state.data.loadRelatedTraces,
    onAddFilter: actions.addFilter,
    onOpenSpanInLogs: actions.openInLogs,
  };

  return {
    traceIdParam: state.traceIdParam,
    data: state.data,
    stats: state.data.stats,
    resolvedTraceId: state.resolvedTraceId,
    traceTimeBounds: state.traceTimeBounds,
    actions,
    layoutProps,
  };
}
