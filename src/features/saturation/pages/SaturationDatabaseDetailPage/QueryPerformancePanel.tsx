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
import { buildQueryPerformanceCharts, queryDisplayLabel } from "./queryPerformanceModel";

function latencyTone(value: number): KpiTone {
  if (value >= 2000) return "err";
  if (value >= 1000) return "warn";
  return "ok";
}

export function QueryPerformancePanel({ system }: { readonly system: string }) {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const mode = search.scope ?? "collection";
  const catalogueQuery = useQueryPerformanceCatalogue(system);
  const catalogue = catalogueQuery.data;
  const collection = catalogue?.collections.some((item) => item.name === search.collection)
    ? search.collection
    : catalogue?.collections[0]?.name;
  const queryHash = catalogue?.queries.some((item) => item.queryHash === search.queryHash)
    ? search.queryHash
    : catalogue?.queries[0]?.queryHash;
  const value = mode === "collection" ? (collection ?? "") : (queryHash ?? "");

  useEffect(() => {
    if (!catalogue || !value) return;
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
  }, [catalogue, mode, navigate, search.collection, search.queryHash, value]);

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
  const selectedHashes = useMemo(() => {
    if (!response) return new Set<string>();
    if (!search.queries) return new Set(availableHashes);
    return new Set(
      search.queries
        .split(",")
        .filter((hash) => /^[0-9a-f]{16}$/.test(hash) && availableHashes.has(hash))
    );
  }, [availableHashes, response, search.queries]);
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
  const averageOps = selection ? selection.callCount / windowSeconds : 0;
  const selectionLabel = mode === "collection" ? collection : queryHash?.slice(0, 8);

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label="Queries /s"
          value={fmtNum(averageOps)}
          secondary="avg"
          subtext={selectionLabel}
        />
        <KpiCard
          label="p95 latency"
          value={fmtMs(selection?.p95Ms ?? 0)}
          tone={latencyTone(selection?.p95Ms ?? 0)}
          subtext={selectionLabel}
        />
        <KpiCard
          label="p99 latency"
          value={fmtMs(selection?.p99Ms ?? 0)}
          tone={latencyTone(selection?.p99Ms ?? 0)}
          subtext={selectionLabel}
        />
      </div>
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
