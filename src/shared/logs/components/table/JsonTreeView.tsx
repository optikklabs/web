import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import { memo, useMemo, useRef, useState } from "react";

interface Props {
  readonly data: Record<string, unknown> | unknown[];
}

type FlatNode = {
  id: string;
  nodeKey: string;
  value: unknown;
  depth: number;
  isExpandable: boolean;
  isArray: boolean;
  count: number;
};

function flattenTree(
  data: Record<string, unknown> | unknown[],
  expandedIds: Set<string>,
  maxDepth = 10
): FlatNode[] {
  const result: FlatNode[] = [];

  function traverse(obj: unknown, currentPath: string, depth: number, key: string) {
    if (depth > maxDepth) {
      result.push({
        id: currentPath,
        nodeKey: key,
        value: "[Depth Limit Exceeded]",
        depth,
        isExpandable: false,
        isArray: false,
        count: 0,
      });
      return;
    }

    const isObject = typeof obj === "object" && obj !== null;
    if (isObject) {
      const isArray = Array.isArray(obj);
      const entries = isArray
        ? (obj as unknown[]).map((v, i) => [String(i), v] as const)
        : Object.entries(obj as object);

      result.push({
        id: currentPath,
        nodeKey: key,
        value: obj,
        depth,
        isExpandable: true,
        isArray,
        count: entries.length,
      });

      if (expandedIds.has(currentPath)) {
        for (const [childKey, childValue] of entries) {
          traverse(childValue, `${currentPath}.${childKey}`, depth + 1, childKey);
        }
      }
    } else {
      result.push({
        id: currentPath,
        nodeKey: key,
        value: obj,
        depth,
        isExpandable: false,
        isArray: false,
        count: 0,
      });
    }
  }

  // Start traversing from root items
  const entries = Array.isArray(data)
    ? data.map((v, i) => [String(i), v] as const)
    : Object.entries(data);
  for (const [k, v] of entries) {
    traverse(v, `root.${k}`, 0, k);
  }

  return result;
}

function JsonTreeViewComponent({ data }: Props) {
  // Initially expand root level
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const entries = Array.isArray(data)
      ? data.map((v, i) => [String(i), v] as const)
      : Object.entries(data);
    for (const [k] of entries) {
      initial.add(`root.${k}`);
    }
    return initial;
  });

  const flatNodes = useMemo(() => flattenTree(data, expandedIds), [data, expandedIds]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: flatNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24, // 24px height per row
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      className="max-h-96 overflow-auto"
      style={{
        contain: "strict",
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const node = flatNodes[virtualRow.index];
          if (!node) return null;
          return (
            <div
              key={node.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                paddingLeft: `${node.depth * 16}px`,
              }}
              className="flex items-center"
            >
              <RenderNode
                node={node}
                isExpanded={expandedIds.has(node.id)}
                onToggle={() => toggleExpand(node.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const RenderNode = memo(
  ({
    node,
    isExpanded,
    onToggle,
  }: { node: FlatNode; isExpanded: boolean; onToggle: () => void }) => {
    const handleCopy = () => {
      void navigator.clipboard.writeText(
        typeof node.value === "string" ? node.value : JSON.stringify(node.value, null, 2)
      );
    };

    if (node.isExpandable) {
      const label = node.isArray ? `[${node.count}]` : `{${node.count}}`;
      return (
        <div className="group/node flex w-full items-center">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-1 rounded py-0.5 font-mono text-[12px] hover:bg-accent"
          >
            {isExpanded ? (
              <ChevronDown size={12} className="shrink-0 text-foreground-muted" />
            ) : (
              <ChevronRight size={12} className="shrink-0 text-foreground-muted" />
            )}
            <span className="text-foreground-secondary">{node.nodeKey}</span>
            <span className="text-foreground-muted">{label}</span>
          </button>
        </div>
      );
    }

    return (
      <div className="group/leaf flex w-full items-center gap-1 py-0.5 pl-[20px] font-mono text-[12px]">
        <span className="text-foreground-secondary">{node.nodeKey}:</span>
        <span className={valueClassName(node.value)}>{formatValue(node.value)}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="ml-1 opacity-0 transition-opacity group-hover/leaf:opacity-100"
          title="Copy value"
        >
          <Copy size={10} className="text-foreground-muted" />
        </button>
      </div>
    );
  }
);

function valueClassName(value: unknown): string {
  if (typeof value === "string") return "text-success truncate max-w-[500px]";
  if (typeof value === "number") return "text-chart-1";
  if (typeof value === "boolean") return "text-warning";
  if (value === null) return "text-foreground-muted italic";
  return "text-foreground";
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  if (value === null) return "null";
  return String(value);
}

export const JsonTreeView = memo(JsonTreeViewComponent);
