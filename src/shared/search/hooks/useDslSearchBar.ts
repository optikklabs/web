import { useMemo, useState } from "react";

import type { SuggestionOption } from "../components/chrome/QuerySuggestions";
import { dslContextAtCaret, matchingFields } from "../dsl/dslContext";
import {
  CATEGORY_ORDER,
  type KnownField,
  OPERATOR_OPTIONS,
  POPULAR_ATTRIBUTE_KEYS,
  knownFieldsForScope,
  quickTemplatesForScope,
  suggestableScalarFieldsForScope,
  syntaxExamplesForScope,
} from "../dsl/knownFields";
import { parseDsl } from "../dsl/parseDsl";
import { getRecent, pushRecent } from "../dsl/recentSearches";
import type { ExplorerScope } from "../types/filters";
import { useQuerySuggestions } from "./useQuerySuggestions";

interface Args {
  readonly initial: string;
  readonly scope?: ExplorerScope;
  readonly valueSuggestions?: Readonly<Record<string, readonly SuggestionOption[]>>;
}

export function useDslSearchBar({ initial, scope, valueSuggestions }: Args) {
  const [input, setInput] = useState(initial);
  const [caret, setCaret] = useState(initial.length);

  const [activeIdx, setActiveIdx] = useState(-1);
  const knownFields = useMemo(() => knownFieldsForScope(scope), [scope]);

  const parsed = parseDsl(input, knownFields);
  const context = useMemo(
    () => dslContextAtCaret(input, caret, knownFields),
    [input, caret, knownFields]
  );
  const localValueSuggestions = useMemo(
    () => filterLocalSuggestions(valueSuggestions?.[context.field ?? ""], context.tokenPrefix),
    [valueSuggestions, context.field, context.tokenPrefix]
  );

  const valueQuery = useQuerySuggestions({
    scope,
    field:
      context.kind === "value" && context.field !== null
        ? normalizeSuggestField(context.field)
        : null,
    prefix: context.tokenPrefix,
    enabled:
      context.kind === "value" &&
      localValueSuggestions.length === 0 &&
      isSuggestableField(context.field, scope),
  });

  const recents = scope ? getRecent(scope) : [];
  const templates = quickTemplatesForScope(scope);
  const syntax = syntaxExamplesForScope(scope);

  const suggestions: readonly SuggestionOption[] = buildSuggestions({
    context,
    values: valueQuery.data ?? [],
    localValues: localValueSuggestions,
    knownFields,
    recents,
    templates,
    syntax,
  });

  const isLoading =
    context.kind === "value" && localValueSuggestions.length === 0 && valueQuery.isFetching;

  const onChange = (next: string, pos: number) => {
    setInput(next);
    setCaret(pos);
    setActiveIdx(-1);
  };

  const acceptSuggestion = (opt: SuggestionOption) => {
    switch (opt.kind) {
      case "recent":
      case "template": {
        setInput(opt.query);
        setCaret(opt.query.length);
        setActiveIdx(-1);
        return;
      }
      case "bodyHint": {
        const { head, tail } = splitAroundToken(input, context.tokenStart, caret);
        const insert = `body:"${opt.token}" `;
        const nextInput = `${head}${insert}${tail}`;
        const nextCaret = head.length + insert.length;
        setInput(nextInput);
        setCaret(nextCaret);
        setActiveIdx(-1);
        return;
      }
      case "operator": {
        const nextInput = applyOperator(input, context.field ?? "", opt.insert);
        setInput(nextInput);
        setCaret(nextInput.length);
        setActiveIdx(-1);
        return;
      }
      case "field":
      case "value": {
        const { head, tail } = splitAroundToken(input, context.tokenStart, caret);
        const insert = renderInsert(context, opt.kind === "field" ? opt.insert : opt.value);
        const nextInput = `${head}${insert}${tail}`;
        const nextCaret = head.length + insert.length;
        setInput(nextInput);
        setCaret(nextCaret);
        setActiveIdx(-1);
        return;
      }
    }
  };

  const commit = () => {
    if (scope) pushRecent(scope, input);
  };

  return {
    input,
    setInput,
    caret,
    setCaret,
    parsed,
    context,
    suggestions,
    isLoading,
    activeIdx,
    setActiveIdx,
    onChange,
    acceptSuggestion,
    commit,
  };
}

function normalizeSuggestField(field: string): string {
  if (field === "httpStatusCode") return "httpStatus";
  return field;
}

function isSuggestableField(field: string | null, scope: ExplorerScope | undefined): boolean {
  if (field === null) return false;
  if (field.startsWith("@")) return true;
  return suggestableScalarFieldsForScope(scope).has(normalizeSuggestField(field));
}

interface BuildArgs {
  readonly context: ReturnType<typeof dslContextAtCaret>;
  readonly values: readonly { value: string; count: number }[];
  readonly localValues: readonly SuggestionOption[];
  readonly knownFields: readonly KnownField[];
  readonly recents: readonly { q: string; ts: number }[];
  readonly templates: readonly { label: string; query: string; description: string }[];
  readonly syntax: readonly { label: string; query: string; description: string }[];
}

function buildSuggestions(a: BuildArgs): readonly SuggestionOption[] {
  if (a.context.kind === "empty") {
    return buildEmptyState(a);
  }
  if (a.context.kind === "operator") {
    return OPERATOR_OPTIONS.map<SuggestionOption>((op) => ({
      kind: "operator",
      insert: op.insert,
      label: op.label,
      description: op.description,
      typeBadge: op.typeBadge,
      icon: "operator",
      category: "Operators",
    }));
  }
  if (a.context.kind === "attribute") {
    return POPULAR_ATTRIBUTE_KEYS.filter((k) =>
      k.key.toLowerCase().slice(1).includes(a.context.tokenPrefix.toLowerCase())
    ).map<SuggestionOption>((k) => ({
      kind: "field",
      insert: `${k.key}:`,
      label: k.key,
      description: k.description,
      typeBadge: "STR",
      icon: "attr",
      category: "Attributes",
    }));
  }
  if (a.context.kind === "field") {
    const fieldOptions = matchingFields(a.context.tokenPrefix, a.knownFields)
      .slice()
      .sort(byCategoryThenKey)
      .map<SuggestionOption>((f) => ({
        kind: "field",
        insert: `${f.key}:`,
        label: f.key,
        description: f.description,
        typeBadge: f.typeBadge,
        icon: f.icon,
        category: f.category,
      }));
    if (a.context.bodyHintToken) {
      const t = a.context.bodyHintToken;
      return [
        {
          kind: "bodyHint",
          token: t,
          label: `Search body for: "${t}"`,
          description: "Free-text search across log message body",
          typeBadge: "TXT",
          icon: "body",
          category: "Search",
        },
        ...fieldOptions,
      ];
    }
    return fieldOptions;
  }

  if (a.localValues.length > 0) return a.localValues;
  return a.values.map<SuggestionOption>((v) => ({
    kind: "value",
    value: v.value,
    label: v.value,
    hint: v.count.toLocaleString(),
  }));
}

function buildEmptyState(a: BuildArgs): readonly SuggestionOption[] {
  const out: SuggestionOption[] = [];
  for (const r of a.recents) {
    out.push({
      kind: "recent",
      query: r.q,
      label: r.q,
      icon: "recent",
      category: "Recent",
    });
  }

  for (const t of a.templates) {
    out.push({
      kind: "template",
      query: t.query,
      label: t.label,
      description: t.description,
      hint: t.query,
      icon: "template",
      category: "Suggested filters",
    });
  }
  for (const s of a.syntax) {
    out.push({
      kind: "template",
      query: s.query,
      label: s.label,
      description: s.description,
      hint: s.query,
      icon: "operator",
      category: "Syntax",
    });
  }
  return out;
}

function byCategoryThenKey(a: KnownField, b: KnownField): number {
  const ai = CATEGORY_ORDER.indexOf(a.category);
  const bi = CATEGORY_ORDER.indexOf(b.category);
  if (ai !== bi) return ai - bi;
  return a.key.localeCompare(b.key);
}

function filterLocalSuggestions(
  options: readonly SuggestionOption[] | undefined,
  prefix: string
): readonly SuggestionOption[] {
  if (!options) return [];
  const q = prefix.trim().toLowerCase();
  if (!q) return options;
  return options.filter((option) => option.label.toLowerCase().includes(q));
}

function splitAroundToken(input: string, tokenStart: number, caret: number) {
  return { head: input.slice(0, tokenStart), tail: input.slice(caret) };
}

function renderInsert(context: ReturnType<typeof dslContextAtCaret>, value: string): string {
  if (context.kind === "value") {
    const quoted = /\s/.test(value) ? `"${value}"` : value;
    const key = context.field ?? "";
    return `${key}:${quoted} `;
  }
  return value;
}

function applyOperator(input: string, key: string, op: string): string {
  const trimmed = input.replace(/[ \t]+$/, "");
  if (op === "!=") {
    if (key === "" || !trimmed.endsWith(key)) return `${trimmed}:`;
    const head = trimmed.slice(0, trimmed.length - key.length);
    return `${head}-${key}:`;
  }
  return `${trimmed}${op}`;
}
