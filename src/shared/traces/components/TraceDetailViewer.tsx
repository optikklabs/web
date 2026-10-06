import type { TraceLog, TraceRecord } from "@shared/api/traces/schemas";
import { PageShell } from "@shared/components/ui/layout/PageShell";
import { memo } from "react";

import { useTraceDetailViewerState } from "../hooks/useTraceDetailViewerState";
import type { RelatedTrace, SpanAttributes, SpanEvent } from "../types/detail";
import { TraceDetailEmptySpans } from "./detail/TraceDetailEmptyStates";
import { TraceDetailLayout } from "./detail/TraceDetailLayout";
import { TraceHeader } from "./header/TraceHeader";
import { KPIStrip } from "./kpi/KPIStrip";
import { BottomBar } from "./navigation/BottomBar";
import { ServiceStrip } from "./services/ServiceStrip";

export interface TraceDetailViewerProps {
  readonly traceId: string;
  readonly spans: readonly TraceRecord[];
  readonly stats: {
    readonly totalSpans: number;
    readonly errors: number;
    readonly services: Set<string>;
    readonly durationMs: number;
  };
  readonly traceTimeBounds: {
    readonly startMs: number;
    readonly endMs: number;
  };
  readonly getSpanAttributes?: (spanId: string) => SpanAttributes | null;
  readonly traceLogs?: readonly TraceLog[];
  readonly spanEvents?: readonly SpanEvent[];
  readonly relatedTraces?: readonly RelatedTrace[];
  readonly onBack: () => void;
  readonly onOpenInLogs?: () => void;
}

function TraceDetailViewerComponent({
  traceId,
  spans,
  stats,
  traceTimeBounds,
  getSpanAttributes,
  traceLogs = [],
  spanEvents = [],
  relatedTraces = [],
  onBack,
  onOpenInLogs = () => {},
}: TraceDetailViewerProps) {
  const {
    selectedSpanId,
    selectedSpan,
    activeTab,
    setActiveTab,
    activeService,
    currentAttributes,
    handleSpanClick,
    handleCloseSpan,
    handleServiceChange,
  } = useTraceDetailViewerState({ spans, getSpanAttributes });

  const rootSpan = spans[0];
  const httpStatus = rootSpan?.httpStatusCode ?? undefined;

  if (spans.length === 0) {
    return (
      <PageShell>
        <TraceDetailEmptySpans hasLogs={traceLogs.length > 0} />
      </PageShell>
    );
  }

  return (
    <PageShell className="!gap-0 !pb-0 flex h-full min-h-0 min-h-[calc(100vh-var(--space-header-h,56px)-2rem)] flex-1 flex-col bg-background text-foreground-secondary [font-feature-settings:'tnum']">
      <TraceHeader
        traceId={traceId}
        startMs={traceTimeBounds.startMs}
        rootService={rootSpan?.serviceName}
        rootOperation={rootSpan?.operationName}
        httpMethod={rootSpan?.httpMethod}
        httpStatus={httpStatus}
        onOpenInLogs={onOpenInLogs}
        onBack={onBack}
      />

      <KPIStrip stats={stats} spans={spans} criticalPath={[]} />

      <ServiceStrip
        spans={spans}
        activeService={activeService}
        onActiveServiceChange={handleServiceChange}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <TraceDetailLayout
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          spans={spans}
          traceId={traceId}
          errorCount={stats.errors}
          selectedSpanId={selectedSpanId}
          selectedSpan={selectedSpan}
          onSpanClick={handleSpanClick}
          onCloseSpan={handleCloseSpan}
          criticalPathSpanIds={new Set()}
          errorPathSpanIds={new Set()}
          serviceMap={null}
          errorGroups={[]}
          spanAttributes={currentAttributes}
          spanAttributesLoading={false}
          spanEvents={spanEvents}
          relatedTraces={relatedTraces}
          relatedTracesRequested={relatedTraces.length > 0}
          relatedTracesLoading={false}
          traceLogs={traceLogs}
          traceStartMs={traceTimeBounds.startMs}
          traceEndMs={traceTimeBounds.endMs}
          onAddFilter={() => {}}
          onOpenSpanInLogs={onOpenInLogs}
        />
      </div>

      <BottomBar
        traceId={traceId}
        spanCount={stats.totalSpans}
        serviceCount={stats.services.size}
      />
    </PageShell>
  );
}

export const TraceDetailViewer = memo(TraceDetailViewerComponent);
