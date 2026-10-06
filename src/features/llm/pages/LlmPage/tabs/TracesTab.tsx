import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { useMemo, useRef } from "react";

import DataTable from "@shared/components/ui/data-display/DataTable";
import { ClientExplorerLayout } from "@shared/search/components/chrome/ClientExplorerLayout";
import { ExplorerTableFooter } from "@shared/search/components/chrome/ExplorerTableFooter";
import {
  type ClientExplorerDefinition,
  useClientExplorer,
} from "@shared/search/hooks/useClientExplorer";
import { useCursorPager } from "@shared/search/hooks/useCursorPager";
import { useExplorerKeyboard } from "@shared/search/hooks/useExplorerKeyboard";
import { useExplorerState } from "@shared/search/hooks/useExplorerState";
import type { ExplorerFilter } from "@shared/search/types/filters";
import { formatDuration } from "@shared/utils/formatters";

import type { LlmTrace, LlmTracesRequest } from "../../../api/llmApi";
import { ScorePill } from "../../../components/chips";
import { useLlmTraces } from "../../../hooks/useLlmQueries";
import { formatCost } from "../../../utils/llmFormat";
import { StatusBadge, VendorChip } from "../components/LlmChips";

const LLM_TRACES_EXPLORER: ClientExplorerDefinition<LlmTrace> = {
  fields: {
    service: { label: "Service", value: (trace) => trace.service, facet: true },
    operation: { label: "Operation", value: (trace) => trace.operation, suggest: true },
    vendor: { label: "Vendor", value: (trace) => trace.vendor, facet: true },
    model: { label: "Model", value: (trace) => trace.model, facet: true },
    userId: { label: "User ID", value: (trace) => trace.userId, suggest: true },
    sessionId: { label: "Session ID", value: (trace) => trace.sessionId, suggest: true },
    status: {
      label: "Status",
      value: (trace) => (trace.hasError ? "error" : "ok"),
      facet: true,
    },
    durationMs: { label: "Duration", value: (trace) => trace.durationMs },
    cost: { label: "Cost", value: (trace) => trace.cost },
  },
  searchText: (trace) =>
    [
      trace.operation,
      trace.service,
      trace.vendor,
      trace.model,
      trace.userId,
      trace.sessionId,
      trace.promptPreview,
    ]
      .filter(Boolean)
      .join(" "),
};

function listValues(filters: readonly ExplorerFilter[], field: string): string[] {
  return filters
    .filter((filter) => filter.field === field && (filter.op === "eq" || filter.op === "in"))
    .flatMap((filter) => filter.value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildLlmRequest(
  filters: readonly ExplorerFilter[],
  cursor: string | null
): Omit<LlmTracesRequest, "startTime" | "endTime"> {
  const durationFloor = filters
    .filter(
      (filter) => filter.field === "durationMs" && (filter.op === "gt" || filter.op === "gte")
    )
    .reduce((max, filter) => Math.max(max, Number(filter.value) || 0), 0);
  const statuses = listValues(filters, "status");

  return {
    limit: 100,
    cursor: cursor ?? undefined,
    services: listValues(filters, "service"),
    vendors: listValues(filters, "vendor"),
    models: listValues(filters, "model"),
    status: statuses.length === 1 ? statuses[0].toLowerCase() : undefined,
    minDurationMs: durationFloor || undefined,
  };
}

const columns: ColumnDef<LlmTrace>[] = [
  {
    header: "Status",
    accessorKey: "hasError",
    size: 90,
    cell: ({ row: { original: t } }) => <StatusBadge hasError={t.hasError} />,
  },
  {
    header: "Trace",
    accessorKey: "operation",
    cell: ({ row: { original: t } }) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{t.operation || t.service}</div>
        <div className="truncate font-mono text-[10px] text-foreground-muted">
          {t.promptPreview || t.traceId}
        </div>
      </div>
    ),
  },
  {
    header: "Model",
    accessorKey: "model",
    size: 150,
    cell: ({ row: { original: t } }) => (
      <div className="flex items-center gap-2">
        <VendorChip vendor={t.vendor} />
        <span className="truncate font-mono text-[11px] text-foreground-secondary">{t.model}</span>
      </div>
    ),
  },
  {
    header: "User / Session",
    id: "identity",
    size: 150,
    cell: ({ row: { original: t } }) => (
      <div className="min-w-0 font-mono text-[10px] text-foreground-muted">
        <div className="truncate">{t.userId || "—"}</div>
        <div className="truncate">{t.sessionId || ""}</div>
      </div>
    ),
  },
  {
    header: "Scores",
    id: "scores",
    size: 170,
    cell: ({ row: { original: t } }) => (
      <div className="flex flex-wrap gap-1">
        {t.scores.slice(0, 3).map((s) => (
          <ScorePill key={s.name} score={s} />
        ))}
      </div>
    ),
  },
  {
    header: "Latency",
    accessorKey: "durationMs",
    size: 90,
    meta: { align: "right" },
    cell: ({ row: { original: t } }) => (
      <span className="font-mono text-[11px]">{formatDuration(t.durationMs)}</span>
    ),
  },
  {
    header: "Cost",
    accessorKey: "cost",
    size: 90,
    meta: { align: "right" },
    cell: ({ row: { original: t } }) => <span className="font-mono">{formatCost(t.cost)}</span>,
  },
  {
    header: "",
    id: "chevron",
    size: 34,
    meta: { align: "right" },
    cell: () => <ChevronRight size={14} className="ml-auto text-foreground-muted" />,
  },
];

export default function TracesTab() {
  const navigate = useNavigate();
  const state = useExplorerState();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const request = useMemo(
    () => buildLlmRequest(state.filters, state.cursor),
    [state.filters, state.cursor]
  );
  const tracesQ = useLlmTraces(request);
  const explorer = useClientExplorer({
    rows: tracesQ.data?.results ?? [],
    filters: state.filters,
    definition: LLM_TRACES_EXPLORER,
  });
  const pager = useCursorPager(state, tracesQ.data?.pageInfo.nextCursor);

  useExplorerKeyboard({ onSearchFocus: () => searchInputRef.current?.focus() });

  return (
    <ClientExplorerLayout
      embedded
      state={state}
      searchInputRef={searchInputRef}
      facetGroups={explorer.facetGroups}
      valueSuggestions={explorer.valueSuggestions}
      scope="llm-traces"
      searchPlaceholder="Search LLM traces: vendor:openai model:gpt-5 status:error"
      content={
        tracesQ.isError ? (
          <div className="rounded-md border border-error/30 bg-error-subtle px-4 py-5 text-center text-[12.5px] text-error">
            LLM traces could not be loaded.
          </div>
        ) : (
          <div className="flex flex-col">
            <DataTable
              data={{ columns, rows: explorer.rows, loading: tracesQ.isPending }}
              pagination={{ showPagination: false }}
              config={{
                emptyText: "No LLM traces match the current filters.",
                onRow: (trace) => ({
                  onClick: () =>
                    navigate({
                      to: `/llm/traces/${encodeURIComponent(trace.traceId)}` as string & {},
                    }),
                  style: { cursor: "pointer" },
                }),
              }}
            />
            {explorer.rows.length > 0 || pager.hasNextPage || pager.hasPrevPage ? (
              <ExplorerTableFooter
                rowCount={explorer.rows.length}
                noun={explorer.rows.length === 1 ? "trace" : "traces"}
                onNextPage={pager.onNextPage}
                onPrevPage={pager.onPrevPage}
                hasNextPage={pager.hasNextPage}
                hasPrevPage={pager.hasPrevPage}
              />
            ) : null}
          </div>
        )
      }
    />
  );
}
