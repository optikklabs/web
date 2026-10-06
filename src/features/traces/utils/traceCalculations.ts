import type { SpanRecord, TraceRecord } from "@shared/api/traces/schemas";

export interface TraceStats {
  totalSpans: number;
  durationMs: number;
  services: Set<string>;
  errors: number;
}

/**
 * Calculate summary statistics for a trace from its spans.
 */
export const calculateTraceStats = (spans: TraceRecord[]): TraceStats => {
  const stats: TraceStats = {
    totalSpans: spans.length,
    durationMs: 0,
    services: new Set<string>(),
    errors: 0,
  };

  if (spans.length === 0) return stats;

  let minStart = Number.POSITIVE_INFINITY;
  let maxEnd = Number.NEGATIVE_INFINITY;

  spans.forEach((span) => {
    if (span.serviceName) stats.services.add(span.serviceName);
    if (span.status === "ERROR") stats.errors++;

    const start = span.startTime ? new Date(span.startTime).getTime() : 0;
    const end = span.endTime ? new Date(span.endTime).getTime() : 0;

    if (start && start < minStart) minStart = start;
    if (end && end > maxEnd) maxEnd = end;
  });

  if (minStart !== Number.POSITIVE_INFINITY && maxEnd !== Number.NEGATIVE_INFINITY) {
    stats.durationMs = maxEnd - minStart;
  }

  return stats;
};

/**
 * Adds ISO bounds to a wire span and folds its status to ERROR whenever the
 * server counts it as an error (a CLIENT span with a 5xx reply is UNSET on the
 * wire but still an error).
 */
export function toTraceRecord(span: SpanRecord): TraceRecord {
  const startMs = span.startNs / 1_000_000;
  return {
    ...span,
    status: span.hasError ? "ERROR" : span.status,
    startTime: new Date(startMs).toISOString(),
    endTime: new Date(startMs + span.durationMs).toISOString(),
  };
}
