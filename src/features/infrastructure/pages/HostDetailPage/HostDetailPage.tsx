import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";

import { PageShell } from "@shared/components/ui/layout/PageShell";
import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";

import { getHostOverview } from "../../api/hostDetailApi";
import { getNodes } from "../../api/nodesApi";
import { DetailLogsSection } from "../../components/detail/DetailLogsSection";
import type { InfrastructureNode } from "../../types";
import { tierForNode } from "../../utils/nodeHealth";
import { HostDetailAbout } from "./HostDetailAbout";
import { HostDetailContainers } from "./HostDetailContainers";
import { HostDetailHero, type HostStatus } from "./HostDetailHero";
import { HostDetailKpiCards } from "./HostDetailKpiCards";
import { HostDetailNetwork } from "./HostDetailNetwork";
import { HostDetailServices } from "./HostDetailServices";
import { HostDetailSystemMetrics } from "./HostDetailSystemMetrics";

function useHostNode(host: string): InfrastructureNode | null {
  const nodesQ = useTimeRangeQuery<readonly InfrastructureNode[]>(
    "host-detail.nodes-list",
    (s, e) => getNodes(s, e)
  );
  return useMemo(
    () => nodesQ.data?.find((node) => node.host === host) ?? null,
    [nodesQ.data, host]
  );
}

function statusFromNode(node: InfrastructureNode | null): HostStatus {
  if (!node) return "unknown";
  const tier = tierForNode(node);
  if (tier === "unhealthy") return "alerting";
  if (tier === "degraded") return "warn";
  return "healthy";
}

export default function HostDetailPage(): JSX.Element {
  const params = useParams({ strict: false });
  const host = decodeURIComponent(typeof params.host === "string" ? params.host : "");
  const node = useHostNode(host);
  const status = statusFromNode(node);

  const overviewQ = useTimeRangeQuery(`host-detail.overview.${host}`, (s, e) =>
    getHostOverview(host, s, e)
  );
  const overview = overviewQ.data ?? null;
  const availableMetrics = overview ? overview.availableMetrics : null;

  return (
    <PageShell>
      <HostDetailHero host={host} node={node} overview={overview} status={status} />
      <HostDetailKpiCards overview={overview} />
      <HostDetailAbout about={overview?.about} />
      <HostDetailSystemMetrics host={host} availableMetrics={availableMetrics} />
      <HostDetailNetwork host={host} availableMetrics={availableMetrics} />
      <HostDetailServices host={host} />
      <HostDetailContainers host={host} />
      <DetailLogsSection kind="host" entity={host} />
    </PageShell>
  );
}
