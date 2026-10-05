import { useMemo } from "react";

import type { SuggestionOption } from "../components/chrome/QuerySuggestions";
import type { FacetGroupModel } from "../components/facets/FacetGroup";
import type { ExplorerFilter } from "../types/filters";

type ClientExplorerAtom = string | number | boolean | null | undefined;
type ClientExplorerValue = ClientExplorerAtom | readonly ClientExplorerAtom[];

export interface ClientExplorerField<T> {
  readonly label: string;
  readonly value: (row: T) => ClientExplorerValue;
  readonly facet?: boolean;
  readonly suggest?: boolean;
}

export interface ClientExplorerDefinition<T> {
  readonly fields: Readonly<Record<string, ClientExplorerField<T>>>;
  readonly searchText?: (row: T) => string;
}

interface UseClientExplorerArgs<T> {
  readonly rows: readonly T[];
  readonly filters: readonly ExplorerFilter[];
  readonly definition: ClientExplorerDefinition<T>;
}

function atoms(value: ClientExplorerValue): readonly ClientExplorerAtom[] {
  return Array.isArray(value) ? value : [value as ClientExplorerAtom];
}

function present(value: ClientExplorerAtom): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function text(value: ClientExplorerAtom): string {
  return value == null ? "" : String(value).toLowerCase();
}

function number(value: ClientExplorerAtom): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesValue(value: ClientExplorerValue, filter: ExplorerFilter): boolean {
  const values = atoms(value);
  const needle = filter.value.toLowerCase();
  const choices = filter.value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  switch (filter.op) {
    case "exists":
      return values.some(present);
    case "not_exists":
      return !values.some(present);
    case "eq":
      return values.some((item) => text(item) === needle);
    case "neq":
      return values.every((item) => text(item) !== needle);
    case "contains":
      return values.some((item) => text(item).includes(needle));
    case "not_contains":
      return values.every((item) => !text(item).includes(needle));
    case "in":
      return values.some((item) => choices.includes(text(item)));
    case "not_in":
      return values.every((item) => !choices.includes(text(item)));
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const target = Number(filter.value);
      if (!Number.isFinite(target)) return false;
      return values.some((item) => {
        const candidate = number(item);
        if (candidate === null) return false;
        if (filter.op === "gt") return candidate > target;
        if (filter.op === "gte") return candidate >= target;
        if (filter.op === "lt") return candidate < target;
        return candidate <= target;
      });
    }
  }
}

function defaultSearchText<T>(row: T, definition: ClientExplorerDefinition<T>): string {
  return Object.values(definition.fields)
    .flatMap((field) => atoms(field.value(row)))
    .filter(present)
    .join(" ");
}

function rowMatches<T>(
  row: T,
  filters: readonly ExplorerFilter[],
  definition: ClientExplorerDefinition<T>
): boolean {
  return filters.every((filter) => {
    if (filter.field === "search") {
      const haystack = (
        definition.searchText?.(row) ?? defaultSearchText(row, definition)
      ).toLowerCase();
      const matched = haystack.includes(filter.value.toLowerCase());
      return filter.op === "not_contains" || filter.op === "neq" ? !matched : matched;
    }
    const field = definition.fields[filter.field];
    // Tabs can share URL state while exposing slightly different fields.
    if (!field) return true;
    return matchesValue(field.value(row), filter);
  });
}

function valueCounts<T>(
  rows: readonly T[],
  field: ClientExplorerField<T>
): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const unique = new Set(
      atoms(field.value(row))
        .filter(present)
        .map((item) => String(item))
    );
    for (const value of unique) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function useClientExplorer<T>({ rows, filters, definition }: UseClientExplorerArgs<T>) {
  const filteredRows = useMemo(
    () => rows.filter((row) => rowMatches(row, filters, definition)),
    [rows, filters, definition]
  );

  const fieldCounts = useMemo(() => {
    const out = new Map<string, Array<{ value: string; count: number }>>();
    for (const [key, field] of Object.entries(definition.fields)) {
      if (field.facet || field.suggest) out.set(key, valueCounts(rows, field));
    }
    return out;
  }, [rows, definition]);

  const facetGroups: FacetGroupModel[] = Object.entries(definition.fields)
    .filter(([, field]) => field.facet)
    .map(([key, field]) => ({
      field: key,
      label: field.label,
      buckets: fieldCounts.get(key) ?? [],
    }));

  const valueSuggestions = useMemo<Readonly<Record<string, readonly SuggestionOption[]>>>(() => {
    const out: Record<string, readonly SuggestionOption[]> = {};
    for (const [key, field] of Object.entries(definition.fields)) {
      if (!field.suggest && !field.facet) continue;
      out[key] = (fieldCounts.get(key) ?? []).map((item) => ({
        kind: "value",
        value: item.value,
        label: item.value,
        hint: item.count.toLocaleString(),
      }));
    }
    return out;
  }, [definition, fieldCounts]);

  return { rows: filteredRows, facetGroups, valueSuggestions };
}
