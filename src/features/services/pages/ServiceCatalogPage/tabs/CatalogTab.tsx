import { useState } from "react";

import ServiceDetailDrawer from "@shared/components/ui/drawers/ServiceDetailDrawer";
import { ClientExplorerLayout } from "@shared/search/components/chrome/ClientExplorerLayout";
import type { ClientExplorerDefinition } from "@shared/search/hooks/useClientExplorer";
import { useClientExplorerController } from "@shared/search/hooks/useClientExplorerController";

import { CatalogTable } from "../catalog/CatalogTable";
import type { CatalogRow } from "../catalog/buildCatalogRows";
import { useCatalogList } from "../hooks/useCatalogList";

const SERVICE_EXPLORER: ClientExplorerDefinition<CatalogRow> = {
  fields: {
    service: { label: "Service", value: (row) => row.serviceName, facet: true },
    status: { label: "Status", value: (row) => row.status, facet: true },
    rps: { label: "RPS", value: (row) => row.rps },
    errorRate: { label: "Error rate", value: (row) => row.errorRate },
    p99Ms: { label: "P99 latency", value: (row) => row.p99Ms },
    version: { label: "Version", value: (row) => row.version, suggest: true },
    environment: {
      label: "Environment",
      value: (row) => row.environment,
      suggest: true,
    },
  },
  searchText: (row) => [row.serviceName, row.status, row.version, row.environment].join(" "),
};

export function CatalogTab() {
  const { rows, isPending, isError } = useCatalogList();
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const explorer = useClientExplorerController({ rows, definition: SERVICE_EXPLORER });

  return (
    <>
      <ClientExplorerLayout
        embedded
        {...explorer}
        scope="services"
        searchPlaceholder="Search services: status:error errorRate:>=2 service:checkout"
        content={
          isError ? (
            <div className="rounded-md border border-error/30 bg-error-subtle px-4 py-5 text-center text-[12.5px] text-error">
              Services could not be loaded.
            </div>
          ) : (
            <CatalogTable rows={explorer.rows} loading={isPending} onRowClick={setSelectedName} />
          )
        }
      />
      <ServiceDetailDrawer
        open={Boolean(selectedName)}
        serviceName={selectedName ?? ""}
        onClose={() => setSelectedName(null)}
      />
    </>
  );
}
