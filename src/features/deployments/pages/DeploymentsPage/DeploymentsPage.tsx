import { useNavigate, useSearch } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { useMemo } from "react";

import { PageTabs } from "@shared/components/primitives/ui/page-tabs";
import { Select } from "@shared/components/primitives/ui/select";
import { KpiCard } from "@shared/components/ui/cards/StatCard";
import PageHeader from "@shared/components/ui/layout/PageHeader";
import { PageShell } from "@shared/components/ui/layout/PageShell";
import { ClientExplorerLayout } from "@shared/search/components/chrome/ClientExplorerLayout";
import type { ClientExplorerDefinition } from "@shared/search/hooks/useClientExplorer";
import { useClientExplorerController } from "@shared/search/hooks/useClientExplorerController";
import { formatNumber, formatRelativeTime } from "@shared/utils/formatters";

import type { Deployment } from "../../api/deploymentsApi";
import { useDeploymentsList } from "../../hooks/useDeployments";
import { DeploymentTable } from "./DeploymentTable";
import { DeploymentTimeline } from "./DeploymentTimeline";

type DeploymentsTab = "list" | "timeline";
type DeploymentsSort = "newest" | "oldest" | "traffic" | "errors";

const DEPLOYMENTS_EXPLORER: ClientExplorerDefinition<Deployment> = {
  fields: {
    service: { label: "Service", value: (row) => row.service, facet: true },
    version: { label: "Version", value: (row) => row.version, suggest: true },
    environment: {
      label: "Environment",
      value: (row) => row.environment || "default",
      facet: true,
    },
    requestCount: { label: "Requests", value: (row) => row.requestCount },
    trafficShare: { label: "Traffic share", value: (row) => row.trafficShare },
    errorRate: { label: "Error rate", value: (row) => row.errorRate },
    p95Ms: { label: "P95 latency", value: (row) => row.p95Ms },
  },
  searchText: (row) => `${row.service} ${row.version} ${row.environment || "default"}`,
};

function normalizeTab(value: string | undefined): DeploymentsTab {
  return value === "timeline" ? "timeline" : "list";
}

function normalizeSort(value: string | undefined): DeploymentsSort {
  return value === "oldest" || value === "traffic" || value === "errors" ? value : "newest";
}

export default function DeploymentsPage() {
  const search = useSearch({ from: "/_app/deployments/" });
  const navigate = useNavigate();
  const query = useDeploymentsList();
  const tab = normalizeTab(search.tab);
  const sort = normalizeSort(search.sort);
  const explorer = useClientExplorerController({
    rows: query.data?.results ?? [],
    definition: DEPLOYMENTS_EXPLORER,
  });

  const rows = useMemo(() => {
    return [...explorer.rows].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime();
        case "traffic":
          return b.trafficShare - a.trafficShare;
        case "errors":
          return b.errorRate - a.errorRate;
        default:
          return new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime();
      }
    });
  }, [explorer.rows, sort]);

  const updateSearch = (next: { tab?: string; sort?: string }) => {
    void navigate({
      to: "/deployments",
      search: (previous) => ({ ...previous, ...next }),
      replace: true,
    });
  };

  const openDeployment = (deployment: Deployment) => {
    void navigate({
      to: "/deployments/$service/$version",
      params: { service: deployment.service, version: deployment.version },
      search: {
        from: search.from,
        to: search.to,
        tz: search.tz,
        env: deployment.environment,
      },
    });
  };

  const summary = query.data?.summary;
  return (
    <PageShell>
      <PageHeader
        title="Deployments"
        icon={<Rocket size={24} />}
        subtitle="Compare request volume, errors, and tail latency across reported service versions."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Deployments in range"
          value={query.isPending ? "—" : formatNumber(summary?.deploymentCount ?? 0)}
          subtext="First seen version identities"
        />
        <KpiCard
          label="Services deployed"
          value={query.isPending ? "—" : formatNumber(summary?.serviceCount ?? 0)}
          subtext="With service.version"
        />
        <KpiCard
          label="Environments"
          value={query.isPending ? "—" : formatNumber(summary?.environmentCount ?? 0)}
          subtext="Present in the selected range"
        />
        <KpiCard
          label="Latest deploy"
          value={
            query.isPending
              ? "—"
              : summary?.latestFirstSeen
                ? formatRelativeTime(summary.latestFirstSeen)
                : "None"
          }
          subtext="Latest first-seen timestamp"
        />
      </div>

      <PageTabs
        activeKey={tab}
        items={[
          { key: "list", label: "List", count: rows.length },
          { key: "timeline", label: "Rollout timeline", count: rows.length },
        ]}
        onChange={(key) => updateSearch({ tab: key === "list" ? undefined : key })}
      />

      <ClientExplorerLayout
        embedded
        {...explorer}
        scope="deployments"
        searchPlaceholder="Search deployments: service:checkout environment:prod errorRate:>=2"
        actions={
          <Select
            size="sm"
            className="w-[150px]"
            value={sort}
            onChange={(value) =>
              updateSearch({ sort: value === "newest" ? undefined : String(value) })
            }
            options={[
              { label: "Newest first", value: "newest" },
              { label: "Oldest first", value: "oldest" },
              { label: "Highest traffic", value: "traffic" },
              { label: "Highest errors", value: "errors" },
            ]}
          />
        }
        content={
          query.isError ? (
            <div className="rounded-md border border-error/30 bg-error-subtle px-4 py-5 text-center text-[12.5px] text-error">
              Deployments could not be loaded. {query.error.message}
            </div>
          ) : tab === "timeline" ? (
            <DeploymentTimeline rows={rows} onOpen={openDeployment} />
          ) : (
            <DeploymentTable rows={rows} loading={query.isPending} onOpen={openDeployment} />
          )
        }
      />
    </PageShell>
  );
}
