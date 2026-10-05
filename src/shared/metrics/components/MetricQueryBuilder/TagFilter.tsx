import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Popover } from "@shared/components/primitives/ui/popover";
import { Select } from "@shared/components/primitives/ui/select";
import { cn } from "@shared/lib/utils";

import { useMetricTagValues, useMetricTags } from "@shared/metrics/hooks/useMetricTags";
import type { MetricFilterOperator, MetricTagFilter } from "@shared/metrics/types";

interface TagFilterProps {
  readonly metricName: string;
  readonly filters: MetricTagFilter[];
  readonly onChange: (filters: MetricTagFilter[]) => void;
}

const OPERATOR_OPTIONS = [
  { label: "=", value: "eq" },
  { label: "!=", value: "neq" },
  { label: "in", value: "in" },
  { label: "not in", value: "not_in" },
  { label: "~", value: "wildcard" },
];

function operatorDisplay(op: MetricFilterOperator): string {
  return OPERATOR_OPTIONS.find((o) => o.value === op)?.label ?? op;
}

function filterDisplay(f: MetricTagFilter): string {
  const val = Array.isArray(f.value) ? f.value.join(", ") : f.value;
  return `${f.key} ${operatorDisplay(f.operator)} ${val}`;
}

export function TagFilter({ metricName, filters, onChange }: TagFilterProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [selectedOp, setSelectedOp] = useState<MetricFilterOperator>("eq");
  const [selectedValue, setSelectedValue] = useState("");

  const { data: tagsData } = useMetricTags(metricName);
  const { data: valuesData } = useMetricTagValues(metricName, selectedKey);
  const tags = tagsData?.tags ?? [];

  const tagKeyOptions = useMemo(() => tags.map((t) => ({ label: t.key, value: t.key })), [tags]);

  const tagValueOptions = useMemo(() => {
    const vals = valuesData?.tags[0]?.values ?? [];
    return vals.map((v) => ({ label: v, value: v }));
  }, [valuesData]);

  const handleAdd = () => {
    if (!selectedKey || !selectedValue) return;
    const newFilter: MetricTagFilter = {
      key: selectedKey,
      operator: selectedOp,
      value: selectedValue,
    };
    onChange([...filters, newFilter]);
    setSelectedKey("");
    setSelectedOp("eq");
    setSelectedValue("");
    setAddOpen(false);
  };

  const handleRemove = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {filters.map((f, i) => (
        <span
          key={`${f.key}-${f.operator}-${i}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-2xl border px-[10px] py-[2px]",
            "border-[var(--color-primary-subtle-28)] bg-[var(--color-primary-subtle-12)]",
            "fade-in-0 zoom-in-95 animate-in text-[11px] text-primary duration-150"
          )}
        >
          <span className="max-w-[180px] truncate">{filterDisplay(f)}</span>
          <button
            type="button"
            onClick={() => handleRemove(i)}
            className="ml-0.5 opacity-55 transition-opacity hover:opacity-100"
          >
            <X size={12} />
          </button>
        </span>
      ))}

      {metricName && (
        <Popover
          open={addOpen}
          onOpenChange={setAddOpen}
          className="w-[280px] p-3"
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
              <span>where</span>
            </button>
          }
        >
          <div className="flex flex-col gap-2">
            <Select
              size="sm"
              placeholder="Tag key"
              options={tagKeyOptions}
              value={selectedKey}
              onChange={(v) => {
                setSelectedKey(v as string);
                setSelectedValue("");
              }}
            />
            <Select
              size="sm"
              placeholder="Operator"
              options={OPERATOR_OPTIONS}
              value={selectedOp}
              onChange={(v) => setSelectedOp(v as MetricFilterOperator)}
            />
            <Select
              size="sm"
              placeholder="Value"
              options={tagValueOptions}
              value={selectedValue}
              onChange={(v) => setSelectedValue(v as string)}
            />
            <button
              type="button"
              disabled={!selectedKey || !selectedValue}
              onClick={handleAdd}
              className={cn(
                "h-8 rounded-[var(--card-radius)] px-3 font-medium text-[12px]",
                "transition-colors duration-150",
                selectedKey && selectedValue
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "cursor-not-allowed bg-muted text-foreground-muted"
              )}
            >
              Add filter
            </button>
          </div>
        </Popover>
      )}
    </div>
  );
}
