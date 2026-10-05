import type { ServiceTopologyResponse } from "@shared/api/topology";
import type { TraceErrorGroup, TraceRecord } from "@shared/api/traces/schemas";
import { ServiceTopologyGraph } from "@shared/components/ui/charts/ServiceTopologyGraph/ServiceTopologyGraph";
import {
  buildTopologyGraph,
  topologyEdgeTypes,
  topologyNodeTypes,
} from "@shared/components/ui/charts/ServiceTopologyGraph/buildGraph";
import { memo } from "react";
import type { SpanEvent, VisualizationTab } from "../../types/detail";
import { ErrorsTab } from "../errors/ErrorsTab";
import { RawJsonTab } from "../json/RawJsonTab";

import { WaterfallView } from "../waterfall/WaterfallView";

interface Props {
  readonly activeTab: VisualizationTab;
  readonly spans: readonly TraceRecord[];
  readonly traceId: string;
  readonly selectedSpanId: string | null;
  readonly onSpanClick: (span: { spanId: string }) => void;
  readonly criticalPathSpanIds: Set<string>;
  readonly errorPathSpanIds: Set<string>;
  readonly serviceMap: ServiceTopologyResponse | null;
  readonly spanEvents?: readonly SpanEvent[];
  readonly errorGroups?: readonly TraceErrorGroup[];
  readonly search?: string;
}

function VizAreaComponent(props: Props) {
  const graph = props.serviceMap ? buildTopologyGraph({ data: props.serviceMap }) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {props.activeTab === "waterfall" && (
        <WaterfallView
          spans={props.spans}
          selectedSpanId={props.selectedSpanId}
          onSpanClick={props.onSpanClick}
          criticalPathSpanIds={props.criticalPathSpanIds}
          errorPathSpanIds={props.errorPathSpanIds}
          spanEvents={props.spanEvents}
          search={props.search}
        />
      )}
      {props.activeTab === "service_map" && graph && (
        <div className="relative flex min-h-[420px] flex-1">
          <ServiceTopologyGraph
            nodes={graph.nodes}
            edges={graph.edges}
            nodeTypes={topologyNodeTypes}
            edgeTypes={topologyEdgeTypes}
          />
        </div>
      )}
      {props.activeTab === "errors" && (
        <ErrorsTab
          spans={props.spans}
          onSelect={props.onSpanClick}
          errorGroups={props.errorGroups}
        />
      )}
      {props.activeTab === "raw" && <RawJsonTab traceId={props.traceId} spans={props.spans} />}
    </div>
  );
}

export const VizArea = memo(VizAreaComponent);
