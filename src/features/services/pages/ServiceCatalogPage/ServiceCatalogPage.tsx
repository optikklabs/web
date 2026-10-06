import { RefreshCw, Server } from "lucide-react";

import { useAppStore } from "@app/store/appStore";
import { useAuthTenant } from "@app/store/authStore";
import { Button } from "@shared/components/primitives/ui/button";
import { PageTabs } from "@shared/components/primitives/ui/page-tabs";
import PageHeader from "@shared/components/ui/layout/PageHeader";
import { PageShell } from "@shared/components/ui/layout/PageShell";
import { fmtNum } from "@shared/utils/formatters";

import type { CatalogRow } from "./catalog/buildCatalogRows";
import { useCatalogAggregate } from "./hooks/useCatalogAggregate";
import { useCatalogList } from "./hooks/useCatalogList";
import { ServiceHubTabContent } from "./tabs/ServiceHubTabContent";
import { useServiceHubTab } from "./useServiceHubTab";

function pickEnvironment(rows: ReadonlyArray<CatalogRow>): string | null {
  for (const row of rows) {
    if (row.environment !== "") return row.environment;
  }
  return null;
}

function HubBody() {
  const { rows, summary, comparison } = useCatalogList();
  const aggregate = useCatalogAggregate(rows, summary, comparison);
  const { tab, setTab } = useServiceHubTab();
  const environment = pickEnvironment(rows);
  const org = useAuthTenant()?.name ?? null;
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);
  const subtitle = [
    org,
    environment,
    `${aggregate.totalServices} services`,
    `${fmtNum(aggregate.totalRps)} rps total`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHeader
        title="Services"
        icon={<Server size={24} />}
        subtitle={subtitle}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={triggerRefresh}
            aria-label="Refresh services"
          >
            Refresh
          </Button>
        }
      />
      <PageTabs
        activeKey={tab}
        items={[
          { key: "catalog", label: "Catalog", count: aggregate.totalServices },
          { key: "map", label: "Service map" },
        ]}
        onChange={(key) => setTab(key === "map" ? "map" : "catalog")}
      />
      <ServiceHubTabContent tab={tab} />
    </>
  );
}

export default function ServiceCatalogPage() {
  return (
    <PageShell>
      <HubBody />
    </PageShell>
  );
}
