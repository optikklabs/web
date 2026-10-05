import { useEffect } from "react";

import { useAppStore } from "@app/store/appStore";
import { shiftTimeRange, zoomTimeRange } from "@shared/utils/timeBounds";

export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  section: "Navigation" | "Actions" | "Time";
}

export interface UseKeyboardShortcutsResult {
  shortcuts: KeyboardShortcut[];
}

const BASE_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: "command-palette",
    keys: ["Ctrl", "K"],
    description: "Open the command palette",
    section: "Navigation",
  },
  {
    id: "shortcut-help",
    keys: ["?"],
    description: "Open keyboard shortcuts help",
    section: "Navigation",
  },
  {
    id: "refresh",
    keys: ["Shift", "R"],
    description: "Refresh data on the active screen",
    section: "Actions",
  },
  {
    id: "toggle-density",
    keys: ["Shift", "D"],
    description: "Toggle compact density mode",
    section: "Actions",
  },
  {
    id: "time-shift-back",
    keys: ["Shift", "\u2190"],
    description: "Shift time window backward",
    section: "Time",
  },
  {
    id: "time-shift-forward",
    keys: ["Shift", "\u2192"],
    description: "Shift time window forward",
    section: "Time",
  },
  {
    id: "time-zoom-in",
    keys: ["Shift", "\u2191"],
    description: "Zoom in (halve duration)",
    section: "Time",
  },
  {
    id: "time-zoom-out",
    keys: ["Shift", "\u2193"],
    description: "Zoom out (double duration)",
    section: "Time",
  },
  {
    id: "focus-time-picker",
    keys: ["t"],
    description: "Focus time range picker",
    section: "Time",
  },
];

function isInputElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

const TIME_SHORTCUTS = {
  ArrowLeft: () => shiftTimeRange(useAppStore.getState().timeRange, "backward"),
  ArrowRight: () => shiftTimeRange(useAppStore.getState().timeRange, "forward"),
  ArrowUp: () => zoomTimeRange(useAppStore.getState().timeRange, "in"),
  ArrowDown: () => zoomTimeRange(useAppStore.getState().timeRange, "out"),
} satisfies Record<string, () => { startMs: number; endMs: number }>;

function handleKeyboardShortcut(event: KeyboardEvent): void {
  if (isInputElement(document.activeElement)) return;
  const store = useAppStore.getState();
  const timeShortcut = event.shiftKey ? TIME_SHORTCUTS[event.key] : undefined;
  if (timeShortcut) {
    event.preventDefault();
    const bounds = timeShortcut();
    store.setCustomTimeRange(bounds.startMs, bounds.endMs);
    return;
  }
  if (event.key === "t" && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    document.querySelector<HTMLButtonElement>('[data-testid="time-range-trigger"]')?.click();
    return;
  }
  if (event.shiftKey && event.key === "R") {
    event.preventDefault();
    store.triggerRefresh();
  }
}

export function useKeyboardShortcuts(): UseKeyboardShortcutsResult {
  const shortcuts = BASE_SHORTCUTS;

  useEffect(() => {
    document.addEventListener("keydown", handleKeyboardShortcut);
    return () => document.removeEventListener("keydown", handleKeyboardShortcut);
  }, []);

  return { shortcuts };
}
