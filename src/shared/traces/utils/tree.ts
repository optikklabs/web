import type { TraceRecord } from "@shared/api/traces/schemas";

export type EventLevel = "info" | "warn" | "error";

export interface BarEvent {
  readonly level: EventLevel;
  readonly tMs: number;
  readonly name: string;
}

export function eventLevel(name: string): EventLevel {
  const n = name.toLowerCase();
  if (n.includes("exception") || n.includes("error")) return "error";
  if (n.includes("warn") || n.includes("retry")) return "warn";
  return "info";
}

export interface FlatSpan {
  readonly span: TraceRecord;
  readonly depth: number;
  readonly hasChildren: boolean;
  readonly startMs: number;
  readonly endMs: number;
}

export function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  const m = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
  return m * pow;
}

export interface BuildTreeResult {
  readonly flat: readonly FlatSpan[];
  readonly traceStartMs: number;
  readonly traceEndMs: number;
}

function spanStartMs(span: TraceRecord): number {
  return span.startTime ? new Date(span.startTime).getTime() : 0;
}

function spanEndMs(span: TraceRecord): number {
  return span.endTime ? new Date(span.endTime).getTime() : spanStartMs(span) + span.durationMs;
}

function spanBoundEndMs(span: TraceRecord): number {
  return span.endTime ? new Date(span.endTime).getTime() : spanStartMs(span);
}

function sortByStart(spans: TraceRecord[]): void {
  spans.sort((left, right) => spanStartMs(left) - spanStartMs(right));
}

function indexChildren(spans: readonly TraceRecord[]): {
  children: ReadonlyMap<string, TraceRecord[]>;
  roots: TraceRecord[];
} {
  const byId = new Map(spans.map((span) => [span.spanId, span]));
  const children = new Map<string, TraceRecord[]>();
  for (const span of spans) {
    const parentID = span.parentSpanId ?? "";
    if (!parentID || !byId.has(parentID)) continue;
    const siblings = children.get(parentID) ?? [];
    siblings.push(span);
    children.set(parentID, siblings);
  }
  for (const siblings of children.values()) sortByStart(siblings);
  const roots = spans.filter((span) => !span.parentSpanId || !byId.has(span.parentSpanId));
  sortByStart(roots);
  return { children, roots };
}

function traceBounds(
  spans: readonly TraceRecord[]
): Pick<BuildTreeResult, "traceStartMs" | "traceEndMs"> {
  const starts = spans.map(spanStartMs).filter((value) => Number.isFinite(value) && value > 0);
  const ends = spans.map(spanBoundEndMs).filter(Number.isFinite);
  return {
    traceStartMs: starts.length ? Math.min(...starts) : 0,
    traceEndMs: ends.length ? Math.max(...ends) : 0,
  };
}

function flattenTree(
  roots: readonly TraceRecord[],
  children: ReadonlyMap<string, readonly TraceRecord[]>,
  collapsed: ReadonlySet<string>
): FlatSpan[] {
  const flat: FlatSpan[] = [];
  const visit = (span: TraceRecord, depth: number) => {
    const descendants = children.get(span.spanId) ?? [];
    flat.push({
      span,
      depth,
      hasChildren: descendants.length > 0,
      startMs: spanStartMs(span),
      endMs: spanEndMs(span),
    });
    if (!collapsed.has(span.spanId)) {
      descendants.forEach((child) => visit(child, depth + 1));
    }
  };
  roots.forEach((root) => visit(root, 0));
  return flat;
}

export function buildFlatTree(
  spans: readonly TraceRecord[],
  collapsed: ReadonlySet<string>
): BuildTreeResult {
  if (spans.length === 0) return { flat: [], traceStartMs: 0, traceEndMs: 0 };
  const { children, roots } = indexChildren(spans);
  return { flat: flattenTree(roots, children, collapsed), ...traceBounds(spans) };
}

export function matchesQuery(span: TraceRecord, q: string): boolean {
  if (!q) return true;
  const ql = q.toLowerCase();
  const hay =
    `${span.serviceName} ${span.operationName} ${span.httpMethod} ${span.httpStatusCode ?? ""}`.toLowerCase();
  return hay.includes(ql);
}
