import { ChevronDown, Search } from "lucide-react";
import { useDeferredValue, useRef, useState } from "react";

import { Popover } from "@shared/components/primitives/ui/popover";
import { cn } from "@shared/lib/utils";

import { useMetricNames } from "@shared/metrics/hooks/useMetricNames";
import type { MetricNameEntry } from "@shared/metrics/types";

interface MetricSelectorProps {
  readonly value: string;
  readonly onChange: (metricName: string) => void;
}

function groupByPrefix(metrics: MetricNameEntry[]): Map<string, MetricNameEntry[]> {
  const groups = new Map<string, MetricNameEntry[]>();
  for (const m of metrics) {
    const dotIdx = m.name.indexOf(".");
    const prefix = dotIdx > 0 ? m.name.slice(0, dotIdx) : "other";
    const list = groups.get(prefix) ?? [];
    list.push(m);
    groups.set(prefix, list);
  }
  return groups;
}

export function MetricSelector({ value, onChange }: MetricSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useMetricNames(deferredSearch);
  const metrics = data?.metrics ?? [];

  const grouped = groupByPrefix(metrics);

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
    setSearch("");
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setSearch("");
    }
  };

  const displayLabel = value || "Select metric…";

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      className="max-h-[360px] w-[380px] overflow-hidden p-0"
      trigger={
        <button
          type="button"
          className={cn(
            "flex h-8 min-w-[200px] flex-1 items-center gap-2 rounded-[var(--card-radius)]",
            "border border-border bg-muted px-3",
            "text-[12px] transition-colors duration-150",
            "hover:border-border",
            value ? "text-foreground" : "text-foreground-muted"
          )}
        >
          <span className="flex-1 truncate text-left">{displayLabel}</span>
          <ChevronDown size={14} className="shrink-0 text-foreground-muted" />
        </button>
      }
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 border-border border-b px-3 py-2">
          <Search size={14} className="shrink-0 text-foreground-muted" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Search metrics…"
            className="h-6 flex-1 bg-transparent text-[12px] text-foreground outline-none placeholder:text-foreground-muted"
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto p-1">
          {metrics.length === 0 && (
            <div className="px-3 py-6 text-center text-[12px] text-foreground-muted">
              {deferredSearch ? "No metrics found" : "Type to search metrics"}
            </div>
          )}

          {Array.from(grouped.entries()).map(([prefix, items]) => (
            <div key={prefix}>
              <div className="px-2 pt-2 pb-1 font-semibold text-[10px] text-foreground-muted uppercase tracking-[0.12em]">
                {prefix}
              </div>
              {items.map((m) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => handleSelect(m.name)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5",
                    "text-left text-[12px] transition-colors duration-100",
                    m.name === value
                      ? "bg-info-subtle text-foreground"
                      : "text-foreground-secondary hover:bg-accent hover:text-foreground"
                  )}
                >
                  <span className="flex-1 truncate font-mono">{m.name}</span>
                  {m.unit && (
                    <span className="shrink-0 text-[10px] text-foreground-muted">{m.unit}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Popover>
  );
}
