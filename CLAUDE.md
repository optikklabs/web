# CLAUDE.md — web

Conventions for the web repo. The query and ingest services are separate
repositories; this file covers only web.

## What This Repo Owns

UI, interaction, routing, and visualization. All data comes from the query
API; no business logic lives here.

## Layout

- `src/features/<feature>/` — one package per product feature; each owns its
  pages, components, hooks, and API calls.
- `src/shared/<kit>/` — code genuinely reused across features (api, search,
  logs, metrics, traces, components). Nothing feature-specific.
- `src/app/` — auth, layout, providers, store. `src/routes/` — the only place
  features are composed together.
- Boundaries are enforced in CI by `scripts/check-boundaries.mjs`: features
  never import features; `app/`/`shared/` never import features. Do not
  extend its allowlist to route around a boundary — restructure instead.

## Server State — One Policy

- All server state goes through `useStandardQuery` / `useTimeRangeQuery`
  (`src/shared/hooks/`). They carry the single retry policy: never retry 4xx,
  max 2 attempts, from the global client in `src/shared/api/queryClient.ts`.
- Never write bespoke fetch/retry/poll machinery in a feature. A UI "Retry"
  button calls `refetch()`.
- Zustand only for true client-side shared state; TanStack Query owns
  everything from the server. No module-level caches.

## React Discipline

- No `useMemo`/`useCallback` by default. Use them only for a measured
  re-render problem or an identity required by a dependency array. Hooks with
  a dozen memoizations (see `useMetricsExplorer.ts`) are the anti-pattern,
  not the house style.
- Virtualize only unbounded data (log tables, trace waterfalls) — never
  small bounded lists.
- Components small and focused; strict TypeScript, no `any`, no unnecessary
  casts.
- One data path per page. Parallel hook variants for the same view
  (`useTraceDetailData` vs `useTraceDetailEnhanced`) must be collapsed into
  one, not accumulated.
- Tables use the shared `DataTable`
  (`src/shared/components/ui/data-display/DataTable.tsx`), not hand-rolled
  `<table>` markup. A table embedded in a card or panel must set
  `config.maxRows` (plus `rowHeight` when its rows are not ~48px) so it
  scrolls inside its own viewport instead of stretching the surface.
- Charts render through `ObservabilityChart`, with `Loading` while pending and
  `ChartNoDataOverlay` when empty — no per-feature loading/empty markup, and
  no per-feature chart heights. Chart colors come from `getChartColor`
  (`src/shared/utils/chartTheme.ts`), never hard-coded hex values, so legends
  and lines cannot drift apart.

## TypeScript Standards

`tsconfig.json` and `biome.json` enforce most of these; `yarn ci` runs
type-check, biome, the boundary check, knip and the build.

### Compiler

- `strict` plus `noUncheckedIndexedAccess`, `noImplicitReturns`,
  `noImplicitOverride`, `noFallthroughCasesInSwitch` and
  `verbatimModuleSyntax`. An indexed read is `T | undefined`: handle the
  missing case (`rows[0]?.value ?? …`, `.at(-1)`, destructuring with a
  default, an early return) instead of asserting it away.
- No `any`, no `!` non-null assertions, and no `as` casts that a type guard,
  `satisfies` or a narrower declaration could replace. Make constant tables
  `as const` so lookups are typed exactly.
- Type-only imports use `import type` / `type` specifiers.

### Data and lookups

- Every API response is parsed with its zod schema through
  `validateResponse`. Types are `z.infer` of the schema, never a parallel
  hand-written interface.
- A value the API could not compute arrives as `null` and renders as "—".
  Never substitute `0`, `""` or a placeholder label for a missing value.
- Look up untrusted string keys (URL params, query DSL fields, API map keys)
  with `ownEntry` or `Object.hasOwn`, never `obj[key]` or `key in obj`,
  which also match inherited keys such as `toString`.
- Palette and hash-based styling go through `pickCyclic` / `pickByHash`
  (`src/shared/utils/cyclic.ts`); do not hand-roll `arr[i % arr.length]` or
  another string hash.
- A query whose input is missing passes `skipToken` as its `queryFn`,
  never an `enabled: false` plus a non-null assertion inside the function.

### Code shape

- Keep functions within biome's cognitive-complexity limit (20). Split a
  large component into named sub-components and move derivations into pure
  functions beside it (`*Model.ts`) rather than nesting ternaries.
- Optional handlers are optional props: hide the control when the handler
  is absent. Never pass `() => {}` to fill a required prop.
- An empty `catch` holds a comment saying why the failure is safe to ignore.
- Use `console.error` / `console.warn` only for failures a developer must
  see; never leave `console.log` in `src/`.
- Array-index keys only for static lists that never reorder (skeletons,
  fixed segments). Anything with identity keys by that identity.
- Prefer modern built-ins over hand-rolled loops: `Array.prototype.at`,
  `findLast`, `toSorted`, `Map.groupBy`, `Object.hasOwn`.
