import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";

import { KpiCard, type KpiTone } from "@shared/components/ui/cards/StatCard";
import { useTimeRange } from "@shared/hooks/useTimeRangeQuery";
import { fmtMs, fmtNum } from "@shared/utils/formatters";

import { Route } from "@/routes/_app/database/instance/$system";
import { QueryPerformanceCharts } from "./QueryPerformanceCharts";
import { QueryPerformanceControls } from "./QueryPerformanceControls";
import {
  useQueryPerformanceCatalogue,
  useQueryPerformanceSeries,
} from "./hooks/useQueryPerformance";
import {
  buildQueryPerformanceCharts,
  queryDisplayLabel,
  resolveCatalogueSelection,
  selectedQueryHashes,
} from "./queryPerformanceModel";

function latencyTone(value: number): KpiTone {
  if (value >= 2000) return "err";
  if (value >= 1000) return "warn";
  return "ok";
}

/**
 * Rewrites the URL so it names exactly the selection on screen (the resolved
 * collection or query, never both), keeping links and reloads stable.
 */
function useCanonicalSelectionURL(ready: boolean, mode: "collection" | "query", value: string) {
  const navigate = useNavigate();
  const search = Route.useSearch();
  useEffect(() => {
    if (!ready || !value) return;
    const isCanonical =
      mode === "collection"
        ? search.collection === value && search.queryHash === undefined
        : search.queryHash === value && search.collection === undefined;
    if (isCanonical) return;
    void navigate({
      replace: true,
      search: ((previous: Record<string, unknown>) => ({
        ...previous,
        scope: mode === "query" ? "query" : undefined,
        collection: mode === "collection" ? value : undefined,
        queryHash: mode === "query" ? value : undefined,
        queries: undefined,
      })) as never,
    });
  }, [ready, mode, navigate, search.collection, search.queryHash, value]);
}

function SelectionKpis({
  selection,
  windowSeconds,
  label,
}: {
  readonly selection: {
    readonly callCount: number;
    readonly p95Ms: number | null;
    readonly p99Ms: number | null;
  };
  readonly windowSeconds: number;
  readonly label: string | undefined;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiCard
        label="Queries /s"
        value={fmtNum(selection.callCount / windowSeconds)}
        secondary="avg"
        subtext={label}
      />
      <LatencyKpi label="p95 latency" valueMs={selection.p95Ms} subtext={label} />
      <LatencyKpi label="p99 latency" valueMs={selection.p99Ms} subtext={label} />
    </div>
  );
}

function LatencyKpi({
  label,
  valueMs,
  subtext,
}: {
  readonly label: string;
  readonly valueMs: number | null;
  readonly subtext: string | undefined;
}) {
  if (valueMs === null) return <KpiCard label={label} value="—" subtext={subtext} />;
  return (
    <KpiCard label={label} value={fmtMs(valueMs)} tone={latencyTone(valueMs)} subtext={subtext} />
  );
}

export function QueryPerformancePanel({ system }: { readonly system: string }) {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const mode = search.scope ?? "collection";
  const catalogueQuery = useQueryPerformanceCatalogue(system);
  const catalogue = catalogueQuery.data;
  const { collection, queryHash } = resolveCatalogueSelection(catalogue, search);
  const value = mode === "collection" ? (collection ?? "") : (queryHash ?? "");

  useCanonicalSelectionURL(catalogue !== undefined, mode, value);

  const seriesQuery = useQueryPerformanceSeries(system, {
    mode,
    collection,
    queryHash,
    showAll: search.showAll ?? false,
  });
  const response = seriesQuery.data;
  const availableHashes = useMemo(
    () => new Set(response?.series.map((series) => series.queryHash) ?? []),
    [response]
  );
  const selectedHashes = useMemo(
    () => (response ? selectedQueryHashes(search.queries, availableHashes) : new Set<string>()),
    [availableHashes, response, search.queries]
  );
  const chartModel = useMemo(
    () =>
      response
        ? buildQueryPerformanceCharts(response, mode, selectedHashes)
        : { timestamps: [], latency: [], throughput: [] },
    [mode, response, selectedHashes]
  );
  const selection =
    mode === "collection"
      ? catalogue?.collections.find((item) => item.name === collection)
      : catalogue?.queries.find((item) => item.queryHash === queryHash);
  const { getTimeRange } = useTimeRange();
  const { startTime, endTime } = getTimeRange();
  const windowSeconds = Math.max((Number(endTime) - Number(startTime)) / 1000, 1);

  const updateSearch = (changes: Record<string, unknown>) =>
    navigate({
      replace: true,
      search: ((previous: Record<string, unknown>) => ({ ...previous, ...changes })) as never,
    });

  if (catalogueQuery.isError) {
    return (
      <div className="rounded-md border border-error bg-error-subtle px-3 py-2 text-error text-sm">
        Could not load query performance data.
      </div>
    );
  }
  if (catalogueQuery.isPending) {
    return <div className="h-40 animate-pulse rounded-md border border-border bg-card" />;
  }
  if (!catalogue || catalogue.collections.length === 0 || catalogue.queries.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-4 text-[12px] text-foreground-muted">
        No query-level database activity in this time range.
      </div>
    );
  }

  const options =
    mode === "collection"
      ? catalogue.collections.map((item) => ({
          value: item.name,
          label: `${item.name} · ${fmtNum(item.queryCount)} queries`,
        }))
      : catalogue.queries.map((item) => ({
          value: item.queryHash,
          label: queryDisplayLabel(item),
        }));

  return (
    <div className="flex flex-col gap-4">
      <QueryPerformanceControls
        mode={mode}
        options={options}
        value={value}
        series={response?.series ?? []}
        selectedHashes={selectedHashes}
        showAll={search.showAll ?? false}
        truncated={response?.truncated ?? false}
        onModeChange={(nextMode) =>
          void updateSearch({
            scope: nextMode === "query" ? "query" : undefined,
            collection:
              nextMode === "collection" ? (catalogue.collections[0]?.name ?? undefined) : undefined,
            queryHash:
              nextMode === "query" ? (catalogue.queries[0]?.queryHash ?? undefined) : undefined,
            queries: undefined,
            showAll: undefined,
          })
        }
        onValueChange={(nextValue) =>
          void updateSearch({
            collection: mode === "collection" ? nextValue : undefined,
            queryHash: mode === "query" ? nextValue : undefined,
            queries: undefined,
            showAll: undefined,
          })
        }
        onToggleSeries={(hash) => {
          const next = new Set(selectedHashes);
          if (next.has(hash)) next.delete(hash);
          else next.add(hash);
          if (next.size === 0) return;
          void updateSearch({
            queries:
              next.size === availableHashes.size ? undefined : Array.from(next).sort().join(","),
          });
        }}
        onShowAllChange={(showAll) =>
          void updateSearch({ showAll: showAll || undefined, queries: undefined })
        }
      />
      {catalogue.truncated && mode === "query" ? (
        <div className="text-[11px] text-warning">
          Query selection is limited to {catalogue.queries.length} of {catalogue.totalQueries}{" "}
          queries.
        </div>
      ) : null}
      {selection ? (
        <SelectionKpis
          selection={selection}
          windowSeconds={windowSeconds}
          label={mode === "collection" ? collection : queryHash?.slice(0, 8)}
        />
      ) : null}
      {seriesQuery.isError ? (
        <div className="rounded-md border border-error bg-error-subtle px-3 py-2 text-error text-sm">
          Could not load the selected query series.
        </div>
      ) : (
        <QueryPerformanceCharts model={chartModel} mode={mode} />
      )}
    </div>
  );
}
