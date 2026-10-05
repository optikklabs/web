import type { ColumnSizingState, OnChangeFn } from "@tanstack/react-table";
import { useState } from "react";

const STORAGE_PREFIX = "optikk.table.columnSizing.";

function read(storageKey: string | undefined): ColumnSizingState {
  if (!storageKey) return {};
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + storageKey);
    return raw ? (JSON.parse(raw) as ColumnSizingState) : {};
  } catch {
    return {};
  }
}

function write(storageKey: string | undefined, sizing: ColumnSizingState): void {
  if (!storageKey) return;
  try {
    localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(sizing));
  } catch {
    // Quota or private-mode failures must not break the table.
  }
}

/**
 * Column widths for a resizable table, persisted per `storageKey`. Omitting the
 * key keeps widths in memory only, so callers opt into persistence explicitly.
 */
export function useColumnSizing(storageKey?: string): {
  columnSizing: ColumnSizingState;
  onColumnSizingChange: OnChangeFn<ColumnSizingState>;
} {
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => read(storageKey));

  const onColumnSizingChange: OnChangeFn<ColumnSizingState> = (updater) => {
    setColumnSizing((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      write(storageKey, next);
      return next;
    });
  };

  return { columnSizing, onColumnSizingChange };
}
