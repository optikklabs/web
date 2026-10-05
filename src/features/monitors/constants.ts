/** Shared monitor wizard constants — single source of truth for eval/renotify windows. */

export const EVAL_WINDOWS = [60, 300, 900, 3600] as const;

export const RENOTIFY_WINDOWS = [900, 1800, 3600, 7200, 0] as const;

export const DEFAULT_MUTE_SECONDS = 3600;

/**
 * Format a duration in seconds to a human-readable label.
 *   60 → "1m", 3600 → "1h", 0 → "never"
 */
export function formatWindowLabel(sec: number): string {
  if (sec === 0) return "never";
  return sec >= 3600 ? `${sec / 3600}h` : `${sec / 60}m`;
}

export interface MonitorPrioritySpec {
  readonly id: "P1" | "P2" | "P3" | "P4";
  readonly label: string;
  readonly color: string;
  readonly textColor: string;
}

export const MONITOR_PRIORITIES: readonly MonitorPrioritySpec[] = [
  { id: "P1", label: "P1 · page", color: "text-error border-error", textColor: "text-error" },
  {
    id: "P2",
    label: "P2 · ticket",
    color: "text-warning border-warning",
    textColor: "text-warning",
  },
  {
    id: "P3",
    label: "P3 · notify",
    color: "text-foreground-secondary border-border",
    textColor: "text-foreground-secondary",
  },
  {
    id: "P4",
    label: "P4 · info",
    color: "text-foreground-secondary border-border",
    textColor: "text-foreground-muted",
  },
];
