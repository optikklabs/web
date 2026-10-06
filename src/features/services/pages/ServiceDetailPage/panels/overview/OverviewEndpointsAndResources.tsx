import { endpointMethod } from "@shared/utils/endpointMethod";
import { fmtPct } from "@shared/utils/formatters";
import { useEffect, useState } from "react";
import { useServiceHosts } from "../../hooks/useServiceHosts";
import { useTopEndpoints } from "../../hooks/useTopEndpoints";
import { type TopOpRow, TopOpsTable } from "./TopOpsTable";

/** One peak-utilization bar; a null pct means no host reported the metric. */
function UtilizationBar({
  label,
  swatch,
  pct,
}: {
  label: string;
  swatch: string;
  pct: number | null;
}) {
  const color =
    pct === null ? "var(--muted)" : pct >= 90 ? "var(--err)" : pct >= 70 ? "var(--warn)" : swatch;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: swatch }} />
          <span className="font-medium text-foreground">{label}</span>
        </div>
        <span className="font-bold font-mono text-[14px] text-foreground">{fmtPct(pct, 0)}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-muted">
        <div
          className="h-full rounded transition-all duration-300"
          style={{ width: `${Math.round(pct ?? 0)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function OverviewEndpointsAndResources({ serviceName }: { serviceName: string }) {
  const [page, setPage] = useState(0);
  const [cursors, setCursors] = useState<Record<number, string>>({});
  const cursor = page > 0 ? cursors[page - 1] : undefined;

  const endpointsQ = useTopEndpoints(serviceName, 12, cursor);
  const hostsQ = useServiceHosts(serviceName);

  const loading = endpointsQ.isPending || hostsQ.isPending;

  const results = endpointsQ.data?.results ?? [];
  const hasMore = endpointsQ.data?.pageInfo.hasMore ?? false;
  const nextCursor = endpointsQ.data?.pageInfo.nextCursor;

  useEffect(() => {
    if (nextCursor) {
      setCursors((prev) => ({ ...prev, [page]: nextCursor }));
    }
  }, [nextCursor, page]);

  const handleNext = () => {
    if (hasMore) {
      setPage((p) => p + 1);
    }
  };

  const handlePrev = () => {
    if (page > 0) {
      setPage((p) => p - 1);
    }
  };

  // Peak resource utilization across the service's hosts/pods.
  const hosts = hostsQ.data ?? [];
  const peak = (values: Array<number | null>): number | null => {
    const reported = values.filter((v): v is number => v !== null);
    return reported.length > 0 ? Math.max(...reported) : null;
  };
  const resourceMetrics = {
    maxCpu: peak(hosts.map((h) => h.cpu)),
    maxMem: peak(hosts.map((h) => h.mem)),
    totalPods: hosts.length,
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="h-6 w-36 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-[220px] animate-pulse rounded bg-muted" />
        </div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="h-6 w-36 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-[220px] animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const endpointRows: TopOpRow[] = results.map((r, i) => {
    const method = endpointMethod(r);
    return {
      key: `${r.operationName}-${i}`,
      badge: method ?? "—",
      badgeVariant: method === "POST" || method === "PUT" ? "brand" : "success",
      label: r.httpRoute || r.operationName,
      totalCount: r.totalCount,
      errorRate: r.errorRate,
      p99Ms: r.p99Ms,
      p99DeltaPct: r.p99DeltaPct,
    };
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm lg:col-span-2">
        <div className="mb-4">
          <h3 className="font-semibold text-[14px] text-foreground">Top endpoints</h3>
          <p className="mt-0.5 text-[12px] text-foreground-muted">
            Inbound HTTP/RPC endpoints, sorted by request volume
          </p>
        </div>

        <TopOpsTable
          rows={endpointRows}
          labelHeader="Endpoint"
          emptyText="No endpoints captured for this service."
          page={page}
          hasMore={hasMore}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      </div>

      <div className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-[14px] text-foreground">Resource use · max fleet</h3>
        <p className="mt-0.5 mb-4 text-[12px] text-foreground-muted">
          Utilization across {resourceMetrics.totalPods} containers/pods
        </p>

        {resourceMetrics.totalPods === 0 ? (
          <div className="my-auto text-center text-[12.5px] text-foreground-muted">
            No resource statistics available.
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center gap-5">
            <UtilizationBar label="CPU" swatch="var(--warn)" pct={resourceMetrics.maxCpu} />
            <UtilizationBar label="Memory" swatch="var(--chart-1)" pct={resourceMetrics.maxMem} />
          </div>
        )}
      </div>
    </div>
  );
}
