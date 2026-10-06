import { useNavigate, useSearch } from "@tanstack/react-router";
import { HardDrive } from "lucide-react";
import { Suspense, lazy } from "react";

import { PageTabs } from "@shared/components/primitives/ui/page-tabs";
import { Pill } from "@shared/components/primitives/ui/pill";
import PageHeader from "@shared/components/ui/layout/PageHeader";
import { PageShell } from "@shared/components/ui/layout/PageShell";
import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import { getNodesSummary } from "../../api/nodesApi";
import { INFRA_TAB, type InfraTabId, URL_TAB } from "../../constants";
import type { InfrastructureNodeSummary } from "../../types";

const HostsTab = lazy(() => import("./tabs/HostsTab"));
const ContainersTab = lazy(() => import("./tabs/ContainersTab"));

const TAB_ITEMS: { id: InfraTabId; label: string }[] = [
  { id: INFRA_TAB.hosts, label: "Hosts" },
  { id: INFRA_TAB.containers, label: "Containers" },
];

function parseTab(raw: string | null): InfraTabId {
  const allowed = TAB_ITEMS.map((t) => t.id);
  if (raw && (allowed as string[]).includes(raw)) return raw as InfraTabId;
  return INFRA_TAB.hosts;
}

function useNodesSummary() {
  return useTimeRangeQuery<InfrastructureNodeSummary>("infrastructure.nodes-summary", (s, e) =>
    getNodesSummary(s, e)
  );
}

export default function InfrastructureHubPage() {
  const search = useSearch({ from: "/_app/infrastructure/" });
  const navigate = useNavigate();
  const summaryQ = useNodesSummary();
  const summary = summaryQ.data;
  const activeTab = parseTab(search[URL_TAB] ?? null);

  const setTab = (id: InfraTabId) => {
    navigate({
      to: "/infrastructure",
      search: (prev) => ({ ...prev, [URL_TAB]: id === INFRA_TAB.hosts ? undefined : id }),
      replace: true,
    });
  };

  const hostCount =
    summary != null ? summary.healthyNodes + summary.degradedNodes + summary.unhealthyNodes : null;
  const podCount = summary?.totalPods ?? null;
  const alertCount = summary?.unhealthyNodes ?? null;
  const subtitle = [
    hostCount == null ? null : `${hostCount} hosts`,
    podCount == null ? null : `${podCount} pods`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PageShell>
      <PageHeader
        title="Infrastructure"
        icon={<HardDrive size={24} />}
        subtitle={subtitle}
        actions={
          alertCount != null && alertCount > 0 ? (
            <Pill variant="warning" dot>
              {alertCount} in alert
            </Pill>
          ) : undefined
        }
      />
      <PageTabs
        activeKey={activeTab}
        items={TAB_ITEMS.map((tab) => ({
          key: tab.id,
          label: tab.label,
          count: tab.id === INFRA_TAB.hosts ? (hostCount ?? undefined) : (podCount ?? undefined),
        }))}
        onChange={(key) => setTab(parseTab(key))}
      />
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center text-[13px] text-foreground-muted">
            Loading…
          </div>
        }
      >
        {activeTab === INFRA_TAB.hosts ? <HostsTab /> : null}
        {activeTab === INFRA_TAB.containers ? <ContainersTab /> : null}
      </Suspense>
    </PageShell>
  );
}
