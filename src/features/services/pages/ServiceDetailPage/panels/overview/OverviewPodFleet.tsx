import { fmtPct } from "@shared/utils/formatters";
import { useNavigate } from "@tanstack/react-router";
import { useServiceHosts } from "../../hooks/useServiceHosts";

export function OverviewPodFleet({ serviceName }: { serviceName: string }) {
  const navigate = useNavigate();
  const hostsQ = useServiceHosts(serviceName);

  const loading = hostsQ.isPending;

  const handlePodClick = (podName: string) => {
    navigate({ to: `/infrastructure/containers/${podName}` });
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="h-6 w-36 animate-pulse rounded bg-muted" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const pods = hostsQ.data ?? [];

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-[14px] text-foreground">Fleet · {pods.length} pods</h3>
        <p className="mt-0.5 text-[12px] text-foreground-muted">
          Live container instances running in Kubernetes clusters
        </p>
      </div>

      {pods.length === 0 ? (
        <div className="py-8 text-center text-[12.5px] text-foreground-muted">
          No live containers reporting metrics for this service.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {pods.map((pod) => {
            const accent =
              pod.status === "error"
                ? "var(--err)"
                : pod.status === "warn"
                  ? "var(--warn)"
                  : "var(--ok)";

            const cpu = pod.cpu;
            const mem = pod.mem;

            return (
              <button
                type="button"
                key={pod.host}
                onClick={() => handlePodClick(pod.host)}
                className="flex cursor-pointer flex-col justify-between rounded border border-border bg-muted/20 p-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span style={{ backgroundColor: accent }} className="h-2 w-2 rounded-full" />
                    <span className="font-mono text-[11px] text-foreground-muted">
                      {pod.host.split("-").slice(-2).join("-")}
                    </span>
                  </div>
                  <div className="mt-2 font-mono font-semibold text-[11px] text-foreground">
                    {pod.zone}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-1 text-[10px] text-foreground-muted">
                  <div className="flex justify-between">
                    <span>CPU</span>
                    <strong className="font-medium text-foreground">{fmtPct(cpu, 0)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>RAM</span>
                    <strong className="font-medium text-foreground">{fmtPct(mem, 0)}</strong>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
