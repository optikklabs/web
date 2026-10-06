import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, ChevronRight, GitFork } from "lucide-react";
import { memo, useMemo } from "react";

import { HighlightedText } from "@shared/components/primitives/HighlightedText";
import { buildTraceDetailHref } from "@shared/observability/deepLinks";
import { formatTimestamp } from "@shared/utils/formatters";

import { useTimezone } from "@/app/store/appStore";
import { cn } from "@shared/lib/utils";

import { useLogsExplorerStore } from "../../store/logsExplorerStore";
import type { LogRecord } from "../../types/log";
import { serviceSwatchColor } from "../../utils/serviceHue";
import type { SeveritySlug } from "../../utils/severity";
import { severityStyle } from "../../utils/severity";
import { getTraceId } from "../../utils/traceCorrelation";
import { ExpandedLogRow } from "./ExpandedLogRow";

const SEV_LVL_CLASS: Record<SeveritySlug, string> = {
  trace: "text-[var(--trace-c)] bg-[oklch(0.66_0.1_245/0.1)]",
  debug: "text-[var(--debug-c)] bg-[oklch(0.72_0.16_235/0.1)]",
  info: "text-[var(--info-c)] bg-[oklch(0.78_0.16_152/0.1)]",
  warn: "text-[var(--warn-c)] bg-[oklch(0.84_0.16_92/0.1)]",
  error: "text-[var(--err-c)] bg-[oklch(0.7_0.2_25/0.1)]",
  fatal: "text-[var(--fatal-c)] bg-[oklch(0.66_0.22_330/0.12)]",
};

const LEVEL_BADGE_BASE =
  "inline-flex h-[19px] items-center gap-[5px] rounded-[4px] border border-current px-[7px] text-[10.5px] font-medium tracking-[0.02em] font-mono";

const LEVEL_DOT = "h-[5px] w-[5px] rounded-full bg-current";

function levelBadgeClasses(slug: SeveritySlug): string {
  return cn(LEVEL_BADGE_BASE, SEV_LVL_CLASS[slug]);
}

interface Props {
  readonly row: LogRecord;
  readonly searchTerm?: string;
  readonly isSelected?: boolean;
  readonly onClick?: (row: LogRecord) => void;
  readonly onContextMenu?: (row: LogRecord, x: number, y: number) => void;
}

function LogRowComponent({ row, searchTerm, isSelected, onClick, onContextMenu }: Props) {
  const navigate = useNavigate();
  const expanded = useLogsExplorerStore((s) => s.expandedRows.has(row.id));
  const toggleExpanded = useLogsExplorerStore((s) => s.toggleRowExpanded);
  const sev = severityStyle(row.severityBucket);
  const tz = useTimezone();
  const traceId = getTraceId(row);

  // Collapse newlines so load-generator separators / multi-line bodies stay
  // on a single row, and surface a visible placeholder for empty bodies so
  // the row keeps a stable visual presence.
  const displayBody = useMemo(() => {
    let rawBody = row.body;
    if (rawBody.length > 500) {
      rawBody = `${rawBody.slice(0, 500)}...`;
    }
    const collapsed = rawBody.replace(/\s*\n\s*/g, " ⏎ ").trim();
    return collapsed.length > 0 ? collapsed : "(empty)";
  }, [row.body]);

  const handleClick = () => onClick?.(row);
  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      onContextMenu(row, e.clientX, e.clientY);
    }
  };
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpanded(row.id);
  };

  const handleTrace = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!traceId) return;
    const logMs = row.timestamp ? new Date(row.timestamp).getTime() : Date.now();
    const validMs = Number.isFinite(logMs) ? logMs : Date.now();
    const fromMs = validMs - 30 * 60 * 1000;
    const toMs = validMs + 30 * 60 * 1000;
    navigate({ to: buildTraceDetailHref(traceId, undefined, fromMs, toMs) as never });
  };

  const isError = sev.slug === "error";

  return (
    <>
      <div
        className={cn(
          "group grid min-h-7 w-full cursor-pointer grid-cols-[24px_200px_160px_80px_1fr] items-center gap-4 border-b border-b-[oklch(0.26_0.01_270/0.45)] px-[18px] py-[6px] text-left font-mono text-[12.5px] hover:bg-[var(--bg-row-h)] [[data-theme=light]_&]:border-b-[oklch(0.88_0.006_270/0.5)]",
          isError && !isSelected && "bg-[oklch(0.7_0.2_25/0.05)]",
          isSelected && !isError && "bg-[var(--accent-bg)]",
          isSelected && isError && "bg-[oklch(0.7_0.2_25/0.14)]"
        )}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <button
          type="button"
          onClick={handleToggle}
          className="inline-flex items-center text-[var(--fg-3)]"
          aria-label={expanded ? "Collapse row" : "Expand row"}
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <span className="text-[var(--fg-2)]">{formatTimestamp(row.timestamp, tz)}</span>

        <span className="inline-flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap text-[var(--fg-1)]">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: serviceSwatchColor(row.serviceName) }}
          />
          {row.serviceName}
        </span>

        <span>
          <span className={levelBadgeClasses(sev.slug)}>
            <span className={LEVEL_DOT} />
            {sev.shortLabel}
          </span>
        </span>

        <span className="flex min-w-0 items-center gap-2 overflow-hidden text-[var(--fg-0)]">
          <span
            className="overflow-hidden text-ellipsis whitespace-nowrap"
            style={row.body ? undefined : { color: "var(--fg-3)", fontStyle: "italic" }}
          >
            <HighlightedText text={displayBody} match={searchTerm} />
          </span>
          {traceId ? (
            <button
              type="button"
              onClick={handleTrace}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[var(--accent-ln)] bg-transparent px-[7px] py-px font-mono text-[10.5px] text-[var(--accent-2)] group-hover:bg-[var(--accent-bg)]"
              title={`Open trace ${traceId}`}
            >
              <GitFork size={10} />
              trace
              <ArrowRight size={10} />
            </button>
          ) : null}
        </span>
      </div>
      {expanded ? <ExpandedLogRow row={row} /> : null}
    </>
  );
}

export const LogRow = memo(LogRowComponent);
