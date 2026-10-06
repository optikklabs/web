import { useNavigate } from "@tanstack/react-router";

import { ROUTES } from "@/shared/constants/routes";
import { SectionCard } from "@shared/components/ui/layout/SectionCard";
import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import { getFleetPods } from "../../api/nodesApi";
import InfraPodsTable from "../../components/InfraPodsTable";
import type { FleetPod } from "../../types";

interface HostDetailContainersProps {
  readonly host: string;
}

export function HostDetailContainers({ host }: HostDetailContainersProps) {
  const navigate = useNavigate();
  const podsQ = useTimeRangeQuery<FleetPod[]>(`host-detail.fleet-pods.${host}`, (s, e) =>
    getFleetPods(s, e, host)
  );
  const pods = podsQ.data ?? [];

  const onOpenHost = (h: string) => {
    navigate({ to: ROUTES.hostDetail.replace("$host", encodeURIComponent(h as string & {})) });
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
    <SectionCard title="Containers on this host">
      <InfraPodsTable
        pods={pods}
        onOpenContainer={onOpenContainer}
        onOpenHost={onOpenHost}
        isPending={podsQ.isPending}
        emptyText="No containers reported on this host in the current time range."
      />
    </SectionCard>
  );
}
