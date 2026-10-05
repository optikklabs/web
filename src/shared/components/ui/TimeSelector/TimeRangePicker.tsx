import { cn } from "@shared/lib/utils";
import { ChevronDown, Clock } from "lucide-react";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

import type { TimeRange } from "@shared/types";

import { useAppStore, useTimeRange } from "@app/store/appStore";

import { AbsoluteTimeTab } from "./AbsoluteTimeTab";
import { RelativeTimeTab } from "./RelativeTimeTab";
import { DISPLAY_MAP } from "./constants";
import { fmtDatetime } from "./utils";

type Tab = "relative" | "absolute";

function useClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [ref, handler]);
}

function useEscapeKey(handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handler();
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, [handler, enabled]);
}

export default function TimeRangePicker() {
  const timeRange = useTimeRange();
  const setTimeRange = useAppStore((s) => s.setTimeRange);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("relative");

  const closeDropdown = useCallback(() => setOpen(false), []);

  useClickOutside(wrapperRef, closeDropdown);
  useEscapeKey(closeDropdown, open);

  const handleToggle = () => {
    if (!open) {
      setActiveTab(timeRange.kind === "absolute" ? "absolute" : "relative");
    }
    setOpen((v) => !v);
  };

  const selectRange = (range: TimeRange) => {
    setTimeRange(range);
    setOpen(false);
  };

  const displayLabel =
    timeRange.kind === "absolute"
      ? `${fmtDatetime(new Date(timeRange.startMs))} to ${fmtDatetime(new Date(timeRange.endMs))}`
      : DISPLAY_MAP[timeRange.preset] || timeRange.label || "Last 30 minutes";

  const isActivePreset = (preset: string): boolean =>
    timeRange.kind === "relative" && timeRange.preset === preset;

  const fromExpr =
    timeRange.kind === "relative"
      ? `now-${timeRange.preset}`
      : fmtDatetime(new Date(timeRange.startMs));
  const toExpr = timeRange.kind === "relative" ? "now" : fmtDatetime(new Date(timeRange.endMs));

  return (
    <div className="relative inline-flex" ref={wrapperRef}>
      <button
        type="button"
        className={cn(
          "inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border px-3 font-medium text-[13px] transition-all",
          "border-border bg-secondary text-foreground",
          "hover:border-primary hover:bg-muted",
          open && "border-primary bg-muted"
        )}
        onClick={handleToggle}
        data-testid="time-range-trigger"
      >
        <Clock size={14} className="shrink-0 text-primary" />
        <span>{displayLabel}</span>
        <ChevronDown
          size={12}
          className={cn(
            "shrink-0 text-foreground-tertiary transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <dialog
          open
          className="absolute top-[calc(100%+4px)] left-0 z-[1000] m-0 max-h-[calc(100vh-70px)] animate-trp-slide-in overflow-hidden rounded-lg border border-border bg-secondary shadow-xl"
          style={{ width: activeTab === "relative" ? 380 : 560 }}
          aria-label="Time range picker"
          data-testid="time-range-dropdown"
        >
          <div className="flex border-border border-b">
            <button
              type="button"
              className={cn(
                "flex-1 cursor-pointer border-x-0 border-t-0 border-b-2 bg-transparent py-2.5 font-medium text-[13px] transition-colors",
                activeTab === "relative"
                  ? "border-b-primary text-primary"
                  : "border-b-transparent text-foreground-secondary hover:text-foreground"
              )}
              onClick={() => setActiveTab("relative")}
            >
              Relative
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 cursor-pointer border-x-0 border-t-0 border-b-2 bg-transparent py-2.5 font-medium text-[13px] transition-colors",
                activeTab === "absolute"
                  ? "border-b-primary text-primary"
                  : "border-b-transparent text-foreground-secondary hover:text-foreground"
              )}
              onClick={() => setActiveTab("absolute")}
            >
              Absolute
            </button>
          </div>

          {activeTab === "relative" ? (
            <RelativeTimeTab
              fromExpr={fromExpr}
              toExpr={toExpr}
              isActivePreset={isActivePreset}
              onSelectRange={selectRange}
            />
          ) : (
            <AbsoluteTimeTab timeRange={timeRange} onClose={closeDropdown} />
          )}
        </dialog>
      )}
    </div>
  );
}
