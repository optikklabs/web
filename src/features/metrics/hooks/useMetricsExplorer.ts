import { useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";

import { QUERY_LABELS, createDefaultQuery } from "@shared/metrics/constants";
import type {
  ChartType,
  FormulaDefinition,
  MetricAggregation,
  MetricQueryDefinition,
  MetricSpaceAggregation,
  MetricTagFilter,
  TimeStep,
} from "@shared/metrics/types";
import { deserializeStateSnapshot, serializeStateSnapshot } from "@shared/search/utils/urlState";

import type { MetricsExplorerSearch } from "../search";

const DEFAULT_QUERIES: MetricQueryDefinition[] = [createDefaultQuery(QUERY_LABELS[0])];

function decodeQueries(raw: string | undefined): MetricQueryDefinition[] {
  if (!raw) return DEFAULT_QUERIES;
  const parsed = deserializeStateSnapshot<MetricQueryDefinition[]>(raw, DEFAULT_QUERIES);
  return parsed.length > 0 ? parsed : DEFAULT_QUERIES;
}

function encodeQueries(queries: MetricQueryDefinition[]): string {
  return serializeStateSnapshot(queries);
}

const DEFAULT_FORMULAS: FormulaDefinition[] = [];

function decodeFormulas(raw: string | undefined): FormulaDefinition[] {
  if (!raw) return DEFAULT_FORMULAS;
  return deserializeStateSnapshot<FormulaDefinition[]>(raw, DEFAULT_FORMULAS);
}

function encodeFormulas(formulas: FormulaDefinition[]): string | undefined {
  if (formulas.length === 0) return undefined;
  return serializeStateSnapshot(formulas);
}

let formulaCounter = 0;

export function useMetricsExplorer() {
  const search = useSearch({ from: "/_app/metrics" });
  const navigate = useNavigate();

  const patchSearch = (patch: Partial<MetricsExplorerSearch>) => {
    navigate({
      to: "/metrics",
      search: (prev: MetricsExplorerSearch) => ({ ...prev, ...patch }),
      replace: true,
    });
  };

  const queries = useMemo(() => decodeQueries(search.queries), [search.queries]);
  const formulas = useMemo(() => decodeFormulas(search.formulas), [search.formulas]);
  const chartType = search.chartType ?? "line";
  const step = search.step ?? "5m";
  const spaceAgg = search.spaceAgg ?? "avg";

  const setQueries = (next: MetricQueryDefinition[]) => {
    patchSearch({ queries: encodeQueries(next) });
  };

  const addQuery = () => {
    const usedLabels = new Set(queries.map((q) => q.id));
    const nextLabel = QUERY_LABELS.find((l) => !usedLabels.has(l));
    if (!nextLabel) return;
    setQueries([...queries, createDefaultQuery(nextLabel)]);
  };

  const removeQuery = (id: string) => {
    if (queries.length <= 1) return;
    setQueries(queries.filter((q) => q.id !== id));
  };

  const updateQuery = (id: string, patch: Partial<MetricQueryDefinition>) => {
    setQueries(queries.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const updateQueryAggregation = (id: string, aggregation: MetricAggregation) =>
    updateQuery(id, { aggregation });

  const updateQueryMetric = (id: string, metricName: string, aggregation: MetricAggregation) =>
    updateQuery(id, { metricName, aggregation, where: [], groupBy: [] });

  const updateQueryWhere = (id: string, where: MetricTagFilter[]) => updateQuery(id, { where });

  const updateQueryGroupBy = (id: string, groupBy: string[]) => updateQuery(id, { groupBy });

  const setChartType = (ct: ChartType) => patchSearch({ chartType: ct });

  const setStep = (s: TimeStep) => patchSearch({ step: s });

  const setSpaceAgg = (sa: MetricSpaceAggregation) => patchSearch({ spaceAgg: sa });

  const setFormulas = (next: FormulaDefinition[]) => {
    patchSearch({ formulas: encodeFormulas(next) });
  };

  const addFormula = () => {
    formulaCounter++;
    setFormulas([...formulas, { id: `f${formulaCounter}`, expression: "" }]);
  };

  const removeFormula = (id: string) => {
    setFormulas(formulas.filter((f) => f.id !== id));
  };

  const updateFormulaExpression = (id: string, expression: string) => {
    setFormulas(formulas.map((f) => (f.id === id ? { ...f, expression } : f)));
  };

  const canExecute = queries.some((q) => Boolean(q.metricName));

  return {
    queries,
    formulas,
    chartType,
    step,
    spaceAgg,
    canExecute,
    addQuery,
    removeQuery,
    updateQuery,
    updateQueryAggregation,
    updateQueryMetric,
    updateQueryWhere,
    updateQueryGroupBy,
    addFormula,
    removeFormula,
    updateFormulaExpression,
    setChartType,
    setStep,
    setSpaceAgg,
  };
}
