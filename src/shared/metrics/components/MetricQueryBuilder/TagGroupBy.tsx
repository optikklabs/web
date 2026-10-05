import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Popover } from "@shared/components/primitives/ui/popover";
import { Select } from "@shared/components/primitives/ui/select";
import { cn } from "@shared/lib/utils";

import { useMetricTags } from "@shared/metrics/hooks/useMetricTags";

interface TagGroupByProps {
  readonly metricName: string;
  readonly groupBy: string[];
  readonly onChange: (groupBy: string[]) => void;
}

export function TagGroupBy({ metricName, groupBy, onChange }: TagGroupByProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");

  const { data: tagsData } = useMetricTags(metricName);
  const tags = tagsData?.tags ?? [];

  const availableOptions = useMemo(() => {
    const used = new Set(groupBy);
    return tags.filter((t) => !used.has(t.key)).map((t) => ({ label: t.key, value: t.key }));
  }, [tags, groupBy]);

  const handleAdd = () => {
    if (!selectedKey) return;
    onChange([...groupBy, selectedKey]);
    setSelectedKey("");
    setAddOpen(false);
  };

  const handleRemove = (key: string) => {
    onChange(groupBy.filter((k) => k !== key));
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {groupBy.map((key) => (
        <span
          key={key}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border px-2 py-1",
            "border-border bg-muted",
            "text-[12px] text-foreground-secondary",
            "fade-in-0 zoom-in-95 animate-in duration-150"
          )}
        >
          <span className="max-w-[120px] truncate font-mono text-[11px]">{key}</span>
          <button
            type="button"
            onClick={() => handleRemove(key)}
            className="opacity-55 transition-opacity hover:opacity-100"
          >
            <X size={12} />
          </button>
        </span>
      ))}

      {metricName && availableOptions.length > 0 && (
        <Popover
          open={addOpen}
          onOpenChange={setAddOpen}
          className="w-[220px] p-3"
          trigger={
            <button
              type="button"
              className={cn(
                "inline-flex h-6 items-center gap-1 rounded-md px-1.5",
                "text-[11px] text-foreground-muted",
                "hover:bg-accent hover:text-foreground-secondary",
                "transition-colors duration-100"
              )}
            >
              <Plus size={12} />
              <span>by</span>
            </button>
          }
        >
          <div className="flex flex-col gap-2">
            <Select
              size="sm"
              placeholder="Tag key"
              options={availableOptions}
              value={selectedKey}
              onChange={(v) => setSelectedKey(v as string)}
            />
            <button
              type="button"
              disabled={!selectedKey}
              onClick={handleAdd}
              className={cn(
                "h-8 rounded-[var(--card-radius)] px-3 font-medium text-[12px]",
                "transition-colors duration-150",
                selectedKey
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "cursor-not-allowed bg-muted text-foreground-muted"
              )}
            >
              Add group
            </button>
          </div>
        </Popover>
      )}
    </div>
  );
}
