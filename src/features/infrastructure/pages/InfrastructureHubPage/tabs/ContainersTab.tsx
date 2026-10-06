import { useNavigate } from "@tanstack/react-router";

import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";
import { ClientExplorerLayout } from "@shared/search/components/chrome/ClientExplorerLayout";
import type { ClientExplorerDefinition } from "@shared/search/hooks/useClientExplorer";
import { useClientExplorerController } from "@shared/search/hooks/useClientExplorerController";

import { ROUTES } from "@/shared/constants/routes";

import { getFleetPods } from "../../../api/nodesApi";
import InfraPodsTable from "../../../components/InfraPodsTable";
import type { FleetPod } from "../../../types";
import { tierForErrorRate } from "../../../utils/nodeHealth";

const CONTAINERS_EXPLORER: ClientExplorerDefinition<FleetPod> = {
  fields: {
    container: { label: "Container", value: (pod) => pod.podName, facet: true },
    host: { label: "Host", value: (pod) => pod.host, facet: true },
    service: { label: "Service", value: (pod) => pod.services, facet: true },
    status: {
      label: "Status",
      value: (pod) => tierForErrorRate(pod.errorRate),
      facet: true,
    },
    requestCount: { label: "Requests", value: (pod) => pod.requestCount },
    errorRate: { label: "Error rate", value: (pod) => pod.errorRate },
    p95Ms: { label: "P95 latency", value: (pod) => pod.p95LatencyMs },
  },
  searchText: (pod) => `${pod.podName} ${pod.host} ${pod.services.join(" ")}`,
};

export default function ContainersTab() {
  const navigate = useNavigate();

  const query = useTimeRangeQuery<FleetPod[]>("infrastructure.containers.list", (s, e) =>
    getFleetPods(s, e)
  );

  const pods = query.data ?? [];
  const explorer = useClientExplorerController({ rows: pods, definition: CONTAINERS_EXPLORER });

  const onOpenHost = (host: string) => {
    navigate({ to: ROUTES.hostDetail.replace("$host", encodeURIComponent(host as string & {})) });
  };

  const onOpenContainer = (container: string) => {
    navigate({
      to: ROUTES.containerDetail.replace(
        "$container",
        encodeURIComponent(container as string & {})
      ),
    });
  };

  return (
    <ClientExplorerLayout
      embedded
      {...explorer}
      scope="infrastructure-containers"
      searchPlaceholder="Search containers: service:checkout host:node-1 errorRate:>=2"
      content={
        query.isError ? (
          <div className="rounded-md border border-error/30 bg-error-subtle px-4 py-5 text-center text-[12.5px] text-error">
            Containers could not be loaded.
          </div>
        ) : (
          <InfraPodsTable
            pods={explorer.rows}
            onOpenContainer={onOpenContainer}
            onOpenHost={onOpenHost}
            isPending={query.isPending}
            emptyText="No containers match the current filters."
          />
        )
      }
    />
  );
}
