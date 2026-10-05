import { memo } from "react";

import type { MonitorPriority } from "../api/monitorsApi";
import { MONITOR_PRIORITIES } from "../constants";

interface Props {
  readonly priority: MonitorPriority | string;
}

function PriorityChip({ priority }: Props) {
  const spec = MONITOR_PRIORITIES.find((p) => p.id === priority);
  const colorClass = spec?.textColor ?? "text-foreground-muted";

  return <span className={`font-bold font-mono text-[11px] ${colorClass}`}>{priority}</span>;
}

export default memo(PriorityChip);
