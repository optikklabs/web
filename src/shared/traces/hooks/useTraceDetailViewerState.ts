import type { TraceRecord } from "@shared/api/traces/schemas";
import { useState } from "react";
import type { SpanAttributes, VisualizationTab } from "../types/detail";

interface UseTraceDetailViewerStateProps {
  readonly spans: readonly TraceRecord[];
  readonly getSpanAttributes?: (spanId: string) => SpanAttributes | null;
}

function selectedSpanSummary(spans: readonly TraceRecord[], spanId: string | null) {
  const s = spanId ? spans.find((sp) => sp.spanId === spanId) : undefined;
  if (!s) return null;
  return {
    spanId: s.spanId,
    operationName: s.operationName,
    serviceName: s.serviceName,
    status: s.status,
    spanKind: s.spanKind,
    durationMs: s.durationMs,
    httpMethod: s.httpMethod,
    responseStatusCode: s.httpStatusCode ? String(s.httpStatusCode) : undefined,
    startTime: s.startTime,
    endTime: s.endTime,
  };
}

export function useTraceDetailViewerState({
  spans,
  getSpanAttributes,
}: UseTraceDetailViewerStateProps) {
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<VisualizationTab>("waterfall");
  const [activeService, setActiveService] = useState<string | null>(null);

  const selectedSpan = selectedSpanSummary(spans, selectedSpanId);
  const currentAttributes =
    selectedSpanId && getSpanAttributes ? getSpanAttributes(selectedSpanId) : null;

  const handleSpanClick = ({ spanId }: { spanId: string }) => {
    setSelectedSpanId(spanId);
  };

  const handleCloseSpan = () => {
    setSelectedSpanId(null);
  };

  const handleServiceChange = (svc: string | null) => {
    setActiveService(svc);
    if (svc) {
      const first = spans.find((s) => s.serviceName === svc);
      if (first?.spanId) setSelectedSpanId(first.spanId);
    }
  };

  return {
    selectedSpanId,
    selectedSpan,
    activeTab,
    setActiveTab,
    activeService,
    currentAttributes,
    handleSpanClick,
    handleCloseSpan,
    handleServiceChange,
  };
}
