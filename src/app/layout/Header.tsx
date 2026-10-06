import { IconButton } from "@shared/components/primitives/ui/icon-button";
import { Tooltip } from "@shared/components/primitives/ui/tooltip";
import TimeRangePicker from "@shared/components/ui/TimeSelector/TimeRangePicker";
import { useTimeRangeURL } from "@shared/hooks/useTimeRangeURL";
import { isRelativeRange, resolveTimeRangeBounds, timeRangeDurationMs } from "@shared/types";
import { formatRelativeTime } from "@shared/utils/formatters";
import { ChevronDown, ChevronLeft, ChevronRight, Moon, RefreshCw, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useVisibilityInterval } from "./useVisibilityInterval";

import { useAppStore, useLastRefreshAt, useTheme } from "@app/store/appStore";
import { useAuthTenant } from "@app/store/authStore";

import { AUTO_REFRESH_INTERVALS } from "@config/constants";

import { cn } from "@shared/lib/utils";

export default function Header() {
  const tenant = useAuthTenant();
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const autoRefreshInterval = useAppStore((s) => s.autoRefreshInterval);
  const setAutoRefreshInterval = useAppStore((s) => s.setAutoRefreshInterval);
  const timeRange = useAppStore((s) => s.timeRange);
  const setCustomTimeRange = useAppStore((s) => s.setCustomTimeRange);
  const theme = useTheme();
  const setTheme = useAppStore((s) => s.setTheme);
  const [intervalPickerOpen, setIntervalPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // Auto-refresh tick at the user's interval; pauses while tab is hidden.
  useVisibilityInterval(triggerRefresh, autoRefreshInterval);

  useTimeRangeURL();

  const handleRefresh = () => {
    triggerRefresh();
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const shiftTimeRange = (direction: "back" | "forward") => {
    const durationMs = timeRangeDurationMs(timeRange);
    const shiftMs = Math.round(durationMs / 2);
    const { startTime, endTime } = resolveTimeRangeBounds(timeRange);
    const now = Date.now();

    let newStart: number;
    let newEnd: number;
    if (direction === "back") {
      newStart = startTime - shiftMs;
      newEnd = endTime - shiftMs;
    } else {
      newStart = startTime + shiftMs;
      newEnd = Math.min(endTime + shiftMs, now);

      if (newStart >= now) {
        newStart = now - durationMs;
        newEnd = now;
      }
    }
    setCustomTimeRange(newStart, newEnd);
  };

  useEffect(() => {
    if (!intervalPickerOpen) return;
    const handler = (event: MouseEvent): void => {
      if (
        pickerRef.current &&
        event.target instanceof Node &&
        !pickerRef.current.contains(event.target)
      ) {
        setIntervalPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [intervalPickerOpen]);

  const activeInterval =
    AUTO_REFRESH_INTERVALS.find((o) => o.value === autoRefreshInterval) ||
    AUTO_REFRESH_INTERVALS[0];

  const isLive = autoRefreshInterval > 0 && isRelativeRange(timeRange);

  return (
    <header className="relative z-40 flex h-[var(--space-header-h,56px)] items-center justify-between gap-3 overflow-visible border-border border-b bg-surface-overlay px-4 backdrop-blur-[12px] max-md:px-3">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-visible">
        <Tooltip content="Shift time window back">
          <IconButton
            icon={<ChevronLeft size={14} />}
            size="sm"
            variant="ghost"
            label="Shift back"
            onClick={() => shiftTimeRange("back")}
          />
        </Tooltip>

        <TimeRangePicker />

        <Tooltip content="Shift time window forward">
          <IconButton
            icon={<ChevronRight size={14} />}
            size="sm"
            variant="ghost"
            label="Shift forward"
            onClick={() => shiftTimeRange("forward")}
          />
        </Tooltip>

        {isLive && (
          <span className="inline-flex items-center gap-1 rounded-[var(--card-radius)] border border-[color-mix(in_oklch,var(--color-success),transparent_65%)] bg-success-subtle px-2.5 py-1 font-semibold text-[11px] text-success uppercase tracking-[0.06em] shadow-[var(--shadow-sm)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Live
          </span>
        )}
      </div>

      <div className="ml-auto flex min-w-0 shrink items-center gap-2.5">
        {tenant && (
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="whitespace-nowrap text-[11px] text-foreground-muted uppercase tracking-wide max-[1240px]:hidden">
              Workspace
            </span>
            <span className="truncate whitespace-nowrap font-medium text-[12px] text-foreground-secondary">
              {tenant.name}
            </span>
          </div>
        )}

        <div className="relative flex items-center" ref={pickerRef}>
          <Tooltip content={<RefreshTooltipContent />}>
            <button
              type="button"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-l-[var(--card-radius)] border border-border bg-muted text-foreground-secondary shadow-[var(--shadow-sm)] transition-[background-color,border-color,color] hover:bg-white/[0.06] hover:text-foreground",
                autoRefreshInterval && "text-primary"
              )}
              onClick={handleRefresh}
            >
              <RefreshCw size={14} />
            </button>
          </Tooltip>

          <button
            type="button"
            className={cn(
              "inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-r-[var(--card-radius)] border border-border border-l-0 bg-muted pr-2.5 pl-2.5 font-medium text-[12px] text-foreground-muted shadow-[var(--shadow-sm)] transition-[background-color,border-color,color] hover:bg-white/[0.06] hover:text-foreground",
              autoRefreshInterval && "text-primary"
            )}
            onClick={() => setIntervalPickerOpen((v) => !v)}
          >
            {activeInterval.value ? activeInterval.label : ""}
            <ChevronDown size={10} />
          </button>

          {intervalPickerOpen && (
            <div className="absolute top-[calc(100%+8px)] right-0 z-[1000] min-w-[132px] overflow-hidden rounded-[var(--card-radius)] border border-border bg-secondary py-1 shadow-[var(--shadow-md)]">
              <div className="px-3 py-1.5 font-semibold text-[11px] text-foreground-muted uppercase tracking-[0.06em]">
                Auto-refresh
              </div>
              {AUTO_REFRESH_INTERVALS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={cn(
                    "flex w-full items-center whitespace-nowrap border-none bg-none px-3 py-2 text-left text-[12px] text-foreground-secondary transition-colors hover:bg-white/[0.06] hover:text-foreground",
                    opt.value === autoRefreshInterval &&
                      "bg-[var(--color-primary-subtle-10)] font-semibold text-primary"
                  )}
                  onClick={() => {
                    setAutoRefreshInterval(opt.value);
                    setIntervalPickerOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Tooltip content={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
          <IconButton
            icon={theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            variant="ghost"
            label="Toggle theme"
            onClick={toggleTheme}
          />
        </Tooltip>
      </div>
    </header>
  );
}

/**
 * "Refreshed Xs ago" label. Reads the store's refresh timestamp and ticks
 * every 5s in isolation, so the header never re-renders for this display.
 */
function RefreshTooltipContent() {
  const lastRefreshAt = useLastRefreshAt();
  const [, setTick] = useState(0);

  useVisibilityInterval(() => setTick((t) => t + 1), 5_000);

  const refreshLabel = formatRelativeTime(lastRefreshAt);
  return <>{refreshLabel ? `Refresh now · ${refreshLabel}` : "Refresh now"}</>;
}
