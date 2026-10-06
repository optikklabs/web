import ErrorBoundary from "@shared/components/ui/feedback/ErrorBoundary";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServiceTopology } from "../../hooks/useServiceTopology";
import { DependencyList } from "./DependencyList";
import { TopologySVG } from "./TopologySVG";
import { useTopologyData } from "./useTopologyData";

export function OverviewServiceMap({ serviceName }: { serviceName: string }) {
  const navigate = useNavigate();
  const [selectedFocus, setSelectedFocus] = useState(serviceName);
  const topologyQ = useServiceTopology(selectedFocus);

  const loading = topologyQ.isPending;

  const { nodes, edges, upstreamList, downstreamList } = useTopologyData(
    topologyQ.data,
    selectedFocus
  );

  const handleNavigate = (svc: string) => {
    navigate({ to: `/services/${svc}` });
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-[440px] animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-[14px] text-foreground">Service map</h3>
          <p className="mt-0.5 text-[12px] text-foreground-muted">
            Live request topology · click on nodes to inspect or navigate
          </p>
        </div>
        <div className="flex items-center gap-2">
          {topologyQ.data?.nodes && (
            <select
              value={selectedFocus}
              onChange={(e) => setSelectedFocus(e.target.value)}
              className="h-[28px] rounded-md border border-border bg-card px-2 font-medium text-[12px] text-foreground outline-none transition-colors hover:border-foreground-muted"
            >
              {topologyQ.data.nodes.map((n) => (
                <option key={n.name} value={n.name}>
                  Focus: {n.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="relative rounded-lg border border-border bg-muted/10 p-2 lg:col-span-2">
          <ErrorBoundary variant="visualization">
            <TopologySVG
              nodes={nodes}
              edges={edges}
              selectedFocus={selectedFocus}
              onNodeClick={setSelectedFocus}
              onNavigate={handleNavigate}
            />
          </ErrorBoundary>
        </div>

        <div className="flex flex-col gap-3">
          <div className="font-semibold text-[11px] text-foreground-muted uppercase tracking-wider">
            Service Dependencies ({upstreamList.length + downstreamList.length})
          </div>

          <DependencyList
            upstreamList={upstreamList}
            downstreamList={downstreamList}
            onSelectFocus={setSelectedFocus}
          />
        </div>
      </div>
    </div>
  );
}
