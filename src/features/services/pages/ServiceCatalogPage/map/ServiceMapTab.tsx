import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

import { type ServiceTopologyResponse, getServiceTopology } from "@shared/api/topology";
import { ServiceTopologyGraph } from "@shared/components/ui/charts/ServiceTopologyGraph/ServiceTopologyGraph";
import {
  buildTopologyGraph,
  topologyEdgeTypes,
  topologyNodeTypes,
} from "@shared/components/ui/charts/ServiceTopologyGraph/buildGraph";
import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import { ROUTES } from "@/shared/constants/routes";

import { ServiceMapToolbar } from "./ServiceMapToolbar";
import { focusSubgraph, highestTrafficService } from "./focusSubgraph";

type Hops = 1 | 2;

const EMPTY: ServiceTopologyResponse = { nodes: [], edges: [] };

function StatusOverlay({ message, tone }: { message: string; tone: "muted" | "error" }) {
  const color = tone === "error" ? "var(--color-error)" : "var(--text-muted)";
  return (
    <div
      className="absolute inset-0 flex items-center justify-center text-[13px]"
      style={{ color }}
    >
      {message}
    </div>
  );
}

export function ServiceMapTab() {
  const navigate = useNavigate();
  const [focus, setFocus] = useState("");
  const [hops, setHops] = useState<Hops>(1);

  const query = useTimeRangeQuery<ServiceTopologyResponse>(
    "service-hub.map-topology",
    (startTime, endTime) => getServiceTopology({ startTime, endTime })
  );
  const data = query.data ?? EMPTY;

  const services = [...data.nodes]
    .sort((a, b) => b.requestCount - a.requestCount)
    .map((n) => n.name);
  const effectiveFocus = focus || highestTrafficService(data);

  const openService = useCallback(
    (name: string): void => {
      const detail = ROUTES.serviceDetail.replace("$serviceName", encodeURIComponent(name));
      navigate({ to: detail as string & {} });
    },
    [navigate]
  );

  const { nodes, edges, subgraph } = useMemo(() => {
    const sub = focusSubgraph(data, effectiveFocus, hops);
    const built = buildTopologyGraph({ data: sub, onOpen: openService });
    return { nodes: built.nodes, edges: built.edges, subgraph: sub };
  }, [data, effectiveFocus, hops, openService]);

  const isEmpty = !query.isLoading && nodes.length === 0;

  return (
    <div className="flex h-[calc(100vh-260px)] min-h-[480px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-md)]">
      <ServiceMapToolbar
        focus={effectiveFocus}
        services={services}
        onFocusChange={setFocus}
        hops={hops}
        onHopsChange={setHops}
        nodeCount={subgraph.nodes.length}
        edgeCount={subgraph.edges.length}
      />
      <div className="relative flex-1">
        {query.isLoading ? <StatusOverlay message="Loading topology…" tone="muted" /> : null}
        {query.isError ? (
          <StatusOverlay message="Failed to load service topology." tone="error" />
        ) : null}
        {isEmpty && !query.isError ? (
          <StatusOverlay message="No service activity in this time range." tone="muted" />
        ) : null}
        <ServiceTopologyGraph
          nodes={nodes}
          edges={edges}
          nodeTypes={topologyNodeTypes}
          edgeTypes={topologyEdgeTypes}
          onNodeDoubleClick={setFocus}
        />
      </div>
    </div>
  );
}
