import { useIntegrations } from "../../hooks/useNotifications";

export default function IntegrationsTab() {
  const q = useIntegrations();
  if (q.isPending) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-foreground-muted text-xs">
        Loading integrations…
      </div>
    );
  }
  const integrations = q.data ?? [];
  return (
    <div className="grid grid-cols-3 gap-3">
      {integrations.map((it) => {
        const connected = it.status === "connected";
        return (
          <div key={it.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded font-semibold text-white"
                  style={{ background: it.color }}
                >
                  {it.name[0]}
                </div>
                <div>
                  <div className="font-medium text-sm">{it.name}</div>
                  <div className="mt-0.5 text-[11px] text-foreground-muted">{it.desc}</div>
                </div>
              </div>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  connected
                    ? "bg-success-subtle text-success"
                    : "bg-muted text-foreground-secondary"
                }`}
              >
                {connected ? "connected" : "install"}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-[11px] text-foreground-muted">
                {it.count} channel{it.count !== 1 ? "s" : ""}
              </div>
              <button
                type="button"
                disabled={!connected}
                className={`rounded px-2.5 py-1 text-xs ${
                  connected
                    ? "border border-border hover:bg-secondary"
                    : "border border-border text-foreground-muted"
                }`}
              >
                {connected ? "Configure" : "Install"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
