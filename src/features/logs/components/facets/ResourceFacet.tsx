import { Minus, Plus } from "lucide-react";
import { memo, useState } from "react";

import type { LogsFacetValue } from "@shared/logs/api/logsAnalyticsApi";

interface Props {
  readonly field: string;
  readonly label: string;
  readonly values: readonly LogsFacetValue[];
  readonly onInclude: (field: string, value: string) => void;
  readonly onExclude: (field: string, value: string) => void;
}

const INITIAL_SHOW = 5;

function ResourceFacetComponent({ field, label, values, onInclude, onExclude }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? values : values.slice(0, INITIAL_SHOW);
  const hasMore = values.length > INITIAL_SHOW;

  if (values.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="font-semibold text-[10.5px] text-[var(--fg-3)] uppercase tracking-[0.08em]">
        {label}
      </div>
      {visible.map((item) => (
        <button
          key={item.value || "(empty)"}
          type="button"
          className="group grid w-full cursor-pointer grid-cols-[1fr_auto] items-center rounded-[5px] border-0 bg-transparent px-[6px] py-[5px] text-left text-[13px] hover:bg-[var(--bg-2)]"
          onClick={() => onInclude(field, item.value)}
          onContextMenu={(e) => {
            e.preventDefault();
            onExclude(field, item.value);
          }}
          title={"Click to filter, right-click to exclude"}
        >
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[var(--fg-1)]">
            {item.value || "(empty)"}
          </span>
          <span className="inline-flex items-center gap-[6px]">
            <span className="inline-flex gap-[2px] opacity-0 group-hover:opacity-100">
              <Plus size={10} className="text-success" />
              <Minus size={10} className="text-error" />
            </span>
            <span className="ml-2 font-mono text-[11px] text-[var(--fg-3)]">
              {item.count.toLocaleString()}
            </span>
          </span>
        </button>
      ))}
      {hasMore ? (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="cursor-pointer border-0 bg-transparent px-[6px] py-1 text-left text-[var(--accent-2)] text-xs hover:underline"
        >
          {showAll ? "Show less" : `Show all ${values.length}`}
        </button>
      ) : null}
    </div>
  );
}

export const ResourceFacet = memo(ResourceFacetComponent);
