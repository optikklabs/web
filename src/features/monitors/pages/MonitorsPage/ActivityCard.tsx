import { formatRelativeTime } from "@shared/utils/formatters";
import { memo } from "react";

import type { MonitorEvent } from "../../api/monitorsApi";

interface Props {
  readonly events: readonly MonitorEvent[];
  readonly loading: boolean;
}

const KIND_COLORS: Record<MonitorEvent["kind"], string> = {
  triggered: "bg-error",
  recovered: "bg-success",
};

function ActivityCard({ events, loading }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="font-medium text-foreground text-sm">Recent activity</div>
      <div className="mt-0.5 text-[11px] text-foreground-muted">last 1 hour</div>
      <div className="mt-3 flex flex-col gap-2">
        {loading && events.length === 0 ? (
          <div className="text-foreground-muted text-xs">Loading…</div>
        ) : events.length === 0 ? (
          <div className="text-foreground-muted text-xs">No recent activity.</div>
        ) : (
          events.map((e) => (
            <div key={e.id} className="flex items-start gap-2">
              <span
                className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${KIND_COLORS[e.kind]}`}
              />
              <div className="flex-1">
                <div className="text-foreground text-xs">
                  <span className="font-medium">{e.monitorName}</span> · {e.kind}
                </div>
                <div className="text-[10px] text-foreground-muted">
                  {formatRelativeTime(e.startedAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default memo(ActivityCard);
