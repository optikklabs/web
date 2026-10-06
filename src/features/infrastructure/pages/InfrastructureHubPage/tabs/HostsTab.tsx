import { useNavigate } from "@tanstack/react-router";

import { KpiCard } from "@shared/components/ui/cards/StatCard";
import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";
import { ClientExplorerLayout } from "@shared/search/components/chrome/ClientExplorerLayout";
import type { ClientExplorerDefinition } from "@shared/search/hooks/useClientExplorer";
import { useClientExplorerController } from "@shared/search/hooks/useClientExplorerController";
import { fmtPct } from "@shared/utils/formatters";

import { ROUTES } from "@/shared/constants/routes";

import { getFleetAverage, getNodes, getNodesSummary } from "../../../api/nodesApi";
import { InfraHostsTable } from "../../../components/InfraHostsTable";
import type { InfrastructureNode, InfrastructureNodeSummary } from "../../../types";
import { tierForErrorRate } from "../../../utils/nodeHealth";

const HOSTS_EXPLORER: ClientExplorerDefinition<InfrastructureNode> = {
  fields: {
    host: { label: "Host", value: (node) => node.host, facet: true },
    service: { label: "Service", value: (node) => node.services, facet: true },
    status: {
      label: "Status",
      value: (node) => tierForErrorRate(node.errorRate),
      facet: true,
    },
    requestCount: { label: "Requests", value: (node) => node.requestCount },
    errorRate: { label: "Error rate", value: (node) => node.errorRate },
    p95Ms: { label: "P95 latency", value: (node) => node.p95LatencyMs },
  },
  searchText: (node) => `${node.host} ${node.services.join(" ")}`,
};

export default function HostsTab() {
  const navigate = useNavigate();

  const query = useTimeRangeQuery<readonly InfrastructureNode[]>(
    "infrastructure.hosts.list",
    (s, e) => getNodes(s, e)
  );

  const summaryQ = useTimeRangeQuery<InfrastructureNodeSummary>(
    "infrastructure.nodes-summary",
    (s, e) => getNodesSummary(s, e)
  );

  const avgCpuQ = useTimeRangeQuery("infrastructure.kpi.cpu-avg", (s, e) =>
    getFleetAverage("cpu", s, e)
  );
  const avgMemQ = useTimeRangeQuery("infrastructure.kpi.memory-avg", (s, e) =>
    getFleetAverage("memory", s, e)
  );

  const nodes = query.data ?? [];
  const summary = summaryQ.data;
  const explorer = useClientExplorerController({ rows: nodes, definition: HOSTS_EXPLORER });

  const onOpenNode = (host: string) => {
    navigate({ to: ROUTES.hostDetail.replace("$host", encodeURIComponent(host as string & {})) });
  };

  const hostsCount = nodes.length;
  const totalPods = summary?.totalPods ?? 0;

  const totalHostsSummary = summary
    ? summary.healthyNodes + summary.degradedNodes + summary.unhealthyNodes
    : 0;
  const hostsUpVal = summary ? summary.healthyNodes + summary.degradedNodes : 0;

  const avgCpuVal = fmtPct(avgCpuQ.data?.value, 0);
  const avgMemVal = fmtPct(avgMemQ.data?.value, 0);

  return (
    <ClientExplorerLayout
      embedded
      {...explorer}
      scope="infrastructure-hosts"
      searchPlaceholder="Search hosts: status:degraded service:checkout errorRate:>=2"
      content={
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <KpiCard
              label="Hosts up"
              value={String(hostsCount || hostsUpVal)}
              subtext={totalHostsSummary > 0 ? `of ${totalHostsSummary}` : "fleet"}
            />
            <KpiCard label="Pods" value={String(totalPods)} subtext="k8s cluster" />
            <KpiCard label="Avg CPU" value={avgCpuVal} subtext="fleet" />
            <KpiCard label="Avg Mem" value={avgMemVal} subtext="fleet" />
          </div>

          {query.isError ? (
            <div className="rounded-md border border-error/30 bg-error-subtle px-4 py-5 text-center text-[12.5px] text-error">
              Hosts could not be loaded.
            </div>
          ) : (
            <InfraHostsTable
              nodes={explorer.rows}
              onOpenNode={onOpenNode}
              isPending={query.isPending}
              emptyText="No hosts match the current filters."
            />
          )}
        </div>
      }
    />
  );
}
