import { useParams } from "@tanstack/react-router";

import { useTraceDetailData } from "../../../hooks/useTraceDetailData";
import { useTraceServiceMap } from "../../../hooks/useTraceServiceMap";
import { type VisualizationTab, useTracesStore } from "../../../store/tracesStore";

export function useTraceDetailState() {
  const { traceId } = useParams({ strict: false });
  const traceIdParam = traceId ?? "";

  const rawActiveTab = useTracesStore((s) => s.visualizationTab);

  const activeTab: VisualizationTab =
    rawActiveTab === "service_map" ||
    rawActiveTab === "waterfall" ||
    rawActiveTab === "errors" ||
    rawActiveTab === "raw"
      ? rawActiveTab
      : "waterfall";
  const setActiveTab = useTracesStore((s) => s.setVisualizationTab);

  const data = useTraceDetailData(traceIdParam);

  const resolvedTraceId = data.spans[0]?.traceId || traceIdParam;

  const serviceMap = useTraceServiceMap(
    data.serviceMap,
    data.traceTimeBounds,
    activeTab === "service_map"
  );

  return {
    traceIdParam,
    resolvedTraceId,
    traceTimeBounds: data.traceTimeBounds,
    activeTab,
    setActiveTab,
    data,
    serviceMap,
  };
}
