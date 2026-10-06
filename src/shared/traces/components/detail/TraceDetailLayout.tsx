import type { ServiceTopologyResponse } from "@shared/api/topology";
import type { TraceErrorGroup, TraceLog, TraceRecord } from "@shared/api/traces/schemas";
import { memo, useState } from "react";
import type { RelatedTrace, SpanAttributes, SpanEvent, VisualizationTab } from "../../types/detail";

import { SpanDetailDrawer } from "../drawer/SpanDetailDrawer";
import { TraceTabBar } from "../navigation/TraceTabBar";
import { VizArea } from "./VizArea";

interface SelectedSpan {
  readonly spanId?: string;
  readonly operationName?: string;
  readonly serviceName?: string;
  readonly status?: string;
  readonly spanKind?: string;
  readonly durationMs?: number;
  readonly httpMethod?: string;
  readonly responseStatusCode?: string;
  readonly startTime?: string;
  readonly endTime?: string;
}

export interface TraceDetailLayoutProps {
  readonly activeTab: VisualizationTab;
  readonly onActiveTabChange: (tab: VisualizationTab) => void;
  readonly spans: readonly TraceRecord[];
  readonly traceId: string;
  readonly errorCount: number;
  readonly selectedSpanId: string | null;
  readonly selectedSpan: SelectedSpan | null;
  readonly onSpanClick: (span: { spanId: string }) => void;
  readonly onCloseSpan: () => void;
  readonly criticalPathSpanIds: Set<string>;
  readonly errorPathSpanIds: Set<string>;
  readonly serviceMap: ServiceTopologyResponse | null;
  readonly errorGroups: readonly TraceErrorGroup[];
  readonly spanAttributes: SpanAttributes | null;
  readonly spanAttributesLoading: boolean;
  readonly spanEvents: readonly SpanEvent[];
  readonly relatedTraces: readonly RelatedTrace[];
  readonly relatedTracesRequested: boolean;
  readonly relatedTracesLoading: boolean;
  readonly onLoadRelatedTraces?: () => void;
  readonly traceLogs: readonly TraceLog[];
  readonly traceStartMs?: number;
  readonly traceEndMs?: number;
  readonly search?: string;
  readonly onSearchChange?: (s: string) => void;
  readonly onAddFilter?: (key: string, value: string) => void;
  readonly onOpenSpanInLogs?: () => void;
}

function TraceDetailLayoutComponent(props: TraceDetailLayoutProps) {
  const drawerOpen = !!props.selectedSpanId && !!props.selectedSpan;
  const [internalSearch, setInternalSearch] = useState("");

  const search = props.search ?? internalSearch;
  const setSearch = props.onSearchChange ?? setInternalSearch;

  return (
    <>
      <TraceTabBar
        activeTab={props.activeTab}
        onActiveTabChange={props.onActiveTabChange}
        search={search}
        onSearchChange={setSearch}
        errorCount={props.errorCount}
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <VizArea
          activeTab={props.activeTab}
          spans={props.spans}
          traceId={props.traceId}
          selectedSpanId={props.selectedSpanId}
          onSpanClick={props.onSpanClick}
          criticalPathSpanIds={props.criticalPathSpanIds}
          errorPathSpanIds={props.errorPathSpanIds}
          serviceMap={props.serviceMap}
          spanEvents={props.spanEvents}
          errorGroups={props.errorGroups}
          search={search}
        />
      </div>

      <SpanDetailDrawer
        open={drawerOpen}
        onClose={props.onCloseSpan}
        span={props.selectedSpan}
        spanId={props.selectedSpanId}
        spans={props.spans}
        traceId={props.traceId}
        spanAttributes={props.spanAttributes}
        spanAttributesLoading={props.spanAttributesLoading}
        spanEvents={props.spanEvents}
        relatedTraces={props.relatedTraces}
        relatedTracesRequested={props.relatedTracesRequested}
        relatedTracesLoading={props.relatedTracesLoading}
        onLoadRelatedTraces={props.onLoadRelatedTraces}
        traceLogs={props.traceLogs}
        traceStartMs={props.traceStartMs}
        traceEndMs={props.traceEndMs}
        isCritical={!!props.selectedSpanId && props.criticalPathSpanIds.has(props.selectedSpanId)}
        onSpanClick={props.onSpanClick}
        onAddFilter={props.onAddFilter}
        onOpenInLogs={props.onOpenSpanInLogs}
      />
    </>
  );
}

export const TraceDetailLayout = memo(TraceDetailLayoutComponent);
