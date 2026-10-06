import { useNavigate } from "@tanstack/react-router";

import { ROUTES } from "@/shared/constants/routes";
import { SectionCard } from "@shared/components/ui/layout/SectionCard";
import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import { getNodeServices } from "../../api/nodesApi";
import InfraServicesTable from "../../components/InfraServicesTable";

interface HostDetailServicesProps {
  readonly host: string;
}

export function HostDetailServices({ host }: HostDetailServicesProps) {
  const navigate = useNavigate();
  const servicesQ = useTimeRangeQuery(`host-detail.services.${host}`, (s, e) =>
    getNodeServices(host, Number(s), Number(e))
  );
  const services = servicesQ.data ?? [];

  const onOpenService = (serviceName: string) => {
    navigate({
      to: ROUTES.serviceDetail.replace(
        "$serviceName",
        encodeURIComponent(serviceName as string & {})
      ),
    });
  };

  return (
    <SectionCard title="Services on this host">
      <InfraServicesTable
        services={services}
        onOpenService={onOpenService}
        isPending={servicesQ.isPending}
        emptyText="No instrumented services reported traffic from this host in the current time range."
      />
    </SectionCard>
  );
}
