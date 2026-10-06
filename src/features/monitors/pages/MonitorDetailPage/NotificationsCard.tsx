import { Send } from "lucide-react";
import { memo } from "react";

import type { Monitor } from "../../api/monitorsApi";

interface Props {
  readonly monitor: Monitor;
}

function NotificationsCard({ monitor }: Props) {
  const ids = monitor.notify.channelIds;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="font-medium text-foreground text-sm">Notifications</div>
      <div className="text-[11px] text-foreground-muted">{ids.length} channels configured</div>
      <div className="mt-3 flex flex-col gap-2">
        {ids.length === 0 ? (
          <div className="text-foreground-muted text-xs">No channels configured.</div>
        ) : (
          ids.map((id) => (
            <div
              key={id}
              className="flex items-center justify-between rounded bg-secondary px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Send size={13} className="text-foreground-muted" />
                <span className="font-mono text-xs">channel #{id}</span>
              </div>
              <span className="rounded bg-success-subtle px-1.5 py-0.5 text-[10px] text-success">
                wired
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default memo(NotificationsCard);
