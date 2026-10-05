import type { TraceRecord } from "@shared/api/traces/schemas";
import { tracesService } from "@shared/api/traces/tracesApi";
import { toApiErrorShape } from "@shared/api/utils/errorNormalization";
import { useTimeRange } from "@shared/hooks/useTimeRangeQuery";
import { getTraceLogs } from "@shared/logs/api/traceLogsApi";
import { useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { computeTraceTimeBounds } from "../pages/TraceDetailPage/utils";
import { calculateTraceStats, normalizeSpan, normalizeTraceLog } from "../utils/traceCalculations";
import { deriveErrorSpanIds } from "../utils/tracePaths";
import { useImmutableQuery } from "./useImmutableQuery";

function traceBoundsWithLogs(
  spans: readonly TraceRecord[],
  logs: readonly { timestamp?: unknown }[]
) {
  const bounds = computeTraceTimeBounds(spans);
  if (bounds.startMs !== undefined && bounds.endMs !== undefined) return bounds;

  const timestamps = logs
    .map((log) => (log.timestamp ? new Date(String(log.timestamp)).getTime() : Number.NaN))
    .filter(Number.isFinite);
  return timestamps.length
    ? { startMs: Math.min(...timestamps), endMs: Math.max(...timestamps) }
    : bounds;
}

function queryError(
  spansIsError: boolean,
  spansError: unknown,
  logsIsError: boolean,
  logsError: unknown
) {
  if (spansIsError) return toApiErrorShape(spansError);
  return logsIsError ? toApiErrorShape(logsError) : null;
}

function useTracePayload(
  enabled: boolean,
  tenantID: number | null,
  traceID: string,
  startMs: number,
  endMs: number
) {
  const spansQuery = useImmutableQuery({
    queryKey: ["trace-detail", tenantID, traceID, startMs, endMs],
    queryFn: ({ signal }) => tracesService.getTraceDetail(traceID, startMs, endMs, signal),
    enabled,
  });
  const logsQuery = useImmutableQuery({
    queryKey: ["trace-logs", tenantID, traceID, startMs, endMs],
    queryFn: ({ signal }) => getTraceLogs(traceID, startMs, endMs, undefined, signal),
    enabled,
  });
  const spans = useMemo(() => (spansQuery.data?.spans ?? []).map(normalizeSpan), [spansQuery.data]);
  const logs = useMemo(() => (logsQuery.data?.logs ?? []).map(normalizeTraceLog), [logsQuery.data]);
  return { spansQuery, logsQuery, spans, logs };
}

function useSpanQueries(
  enabled: boolean,
  tenantID: number | null,
  traceID: string,
  spanID: string | null,
  startMs: number,
  endMs: number
) {
  const queryEnabled = enabled && spanID !== null && startMs > 0 && endMs >= startMs;
  const events = useImmutableQuery({
    queryKey: ["trace-span-events", tenantID, traceID, startMs, endMs],
    queryFn: ({ signal }) => tracesService.getSpanEvents(traceID, startMs, endMs, signal),
    enabled: queryEnabled,
  });
  const attributes = useImmutableQuery({
    queryKey: ["span-attributes", tenantID, traceID, spanID, startMs, endMs],
    queryFn: ({ signal }) =>
      tracesService.getSpanAttributes(traceID, spanID!, startMs, endMs, signal),
    enabled: queryEnabled,
  });
  return { events, attributes };
}

function useRelatedTraces(
  enabled: boolean,
  tenantID: number | null,
  traceID: string,
  context: TraceRecord | null,
  startMs: number,
  endMs: number
) {
  const key = `${context?.spanId ?? ""}|${context?.serviceName ?? ""}|${context?.operationName ?? ""}`;
  const [requestedKey, setRequestedKey] = useState<string | null>(null);
  const requested = requestedKey === key;
  const query = useImmutableQuery({
    queryKey: [
      "trace-related",
      tenantID,
      traceID,
      context?.serviceName,
      context?.operationName,
      startMs,
      endMs,
    ],
    queryFn: ({ signal }) =>
      tracesService.getRelatedTraces(
        traceID,
        context?.serviceName,
        context?.operationName,
        startMs,
        endMs,
        signal
      ),
    enabled:
      enabled &&
      requested &&
      Boolean(context?.serviceName && context.operationName) &&
      startMs > 0 &&
      endMs > startMs,
  });
  return { query, requested, load: () => setRequestedKey(key) };
}

// One data path for the trace detail page: the base trace payload, trace
// logs, and the span-scoped queries (events, attributes, related traces).
export function useTraceDetailData(selectedTenantId: number | null, traceIdParam: string) {
  const { span } = useSearch({ from: "/_app/traces/$traceId" });
  const { getTimeRange } = useTimeRange();
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(() => span || null);

  useEffect(() => {
    if (span) setSelectedSpanId(span);
  }, [span]);

  const { startTime, endTime } = getTimeRange();
  const startMs = Number(startTime);
  const endMs = Number(endTime);
  const traceEnabled = selectedTenantId !== null && traceIdParam.length > 0;
  const {
    spansQuery,
    logsQuery,
    spans,
    logs: traceLogs,
  } = useTracePayload(traceEnabled, selectedTenantId, traceIdParam, startMs, endMs);
  const detailData = spansQuery.data;

  const stats = calculateTraceStats(spans);
  const selectedSpan = spans.find((s) => s.spanId === selectedSpanId);

  const traceTimeBounds = traceBoundsWithLogs(spans, traceLogs);

  const boundsStartMs = traceTimeBounds.startMs ?? 0;
  const boundsEndMs = traceTimeBounds.endMs ?? 0;
  const spanQueries = useSpanQueries(
    traceEnabled,
    selectedTenantId,
    traceIdParam,
    selectedSpanId,
    boundsStartMs,
    boundsEndMs
  );
  const relatedContext = selectedSpan ?? spans[0] ?? null;
  const related = useRelatedTraces(
    traceEnabled,
    selectedTenantId,
    traceIdParam,
    relatedContext,
    boundsStartMs,
    boundsEndMs
  );

  const criticalPath = detailData?.criticalPath ?? [];
  const criticalPathSpanIds = useMemo(
    () => new Set((detailData?.criticalPath ?? []).map((s) => s.spanId)),
    [detailData]
  );
  const errorPathSpanIds = useMemo(() => deriveErrorSpanIds(spans), [spans]);

  return {
    spans,
    summary: detailData?.summary ?? null,
    criticalPath,
    serviceMap: detailData?.serviceMap,
    errorGroups: detailData?.errors ?? [],
    traceLogs,
    traceLogsIsSpeculative: logsQuery.data?.isSpeculative ?? false,
    stats,
    selectedSpan,
    selectedSpanId,
    setSelectedSpanId,
    traceTimeBounds,
    criticalPathSpanIds,
    errorPathSpanIds,
    spanEvents: spanQueries.events.data ?? [],
    spanAttributes: spanQueries.attributes.data
      ? {
          ...spanQueries.attributes.data,
          attributes: spanQueries.attributes.data.attributes ?? {},
        }
      : null,
    spanAttributesLoading: spanQueries.attributes.isPending,
    relatedTraces: related.query.data ?? [],
    relatedTracesRequested: related.requested,
    relatedTracesLoading: related.query.isPending,
    loadRelatedTraces: related.load,
    isPending: spansQuery.isPending,
    isError: spansQuery.isError || logsQuery.isError,
    error: queryError(spansQuery.isError, spansQuery.error, logsQuery.isError, logsQuery.error),
    logsLoading: logsQuery.isPending,
  };
}
