import type { TraceRecord } from "@shared/api/traces/schemas";
import type { SpanAttributes } from "@shared/traces/types/detail";
import type { LlmSpan, LlmSpanIO, LlmTraceDetail } from "../api/llmApi";

const TRUNCATION_MARKER = "\n\n… [truncated — loading full content]";

export interface LlmTraceAdapterOptions {
  /** Full prompt/completion fetched on demand, keyed by spanId. */
  spanIO?: Record<string, LlmSpanIO>;
  /** Invoked when a truncated span is viewed without full content yet. */
  onSpanIONeeded?: (spanId: string) => void;
}

function sourceSpans(detail: LlmTraceDetail): LlmSpan[] {
  if (detail.spans.length > 0) return detail.spans;
  return [
    {
      spanId: `${detail.traceId}-root`,
      parentSpanId: "",
      name: detail.name || detail.service,
      service: detail.service,
      operation: detail.name || "chat",
      kind: "chat",
      vendor: "gen_ai",
      model: "",
      startMs: detail.startMs,
      durationMs: detail.durationMs,
      hasError: detail.hasError,
      inputTokens: detail.inputTokens,
      outputTokens: detail.outputTokens,
      cost: detail.cost,
      prompt: detail.prompt,
      completion: detail.output,
    },
  ];
}

function toTraceRecord(detail: LlmTraceDetail, span: LlmSpan, index: number): TraceRecord {
  const durationMs = span.durationMs || 0;
  return {
    traceId: detail.traceId,
    spanId: span.spanId || `span-${index}`,
    parentSpanId: span.parentSpanId || "",
    serviceName: span.service || detail.service,
    operationName: span.name || span.operation || "gen_ai",
    spanKind: (span.kind || "SPAN").toUpperCase(),
    startTime: new Date(span.startMs).toISOString(),
    endTime: new Date(span.startMs + durationMs).toISOString(),
    durationMs,
    status: span.hasError ? "ERROR" : "OK",
    hasError: span.hasError,
    startNs: (span.startMs || 0) * 1_000_000,
    statusMessage: span.hasError ? "Error during LLM execution" : "",
    httpMethod: "",
    httpStatusCode: null,
  };
}

function markTruncated(value: string | undefined, truncated: boolean): string | undefined {
  return value && truncated ? value + TRUNCATION_MARKER : value;
}

function genAIAttributes(span: LlmSpan): Record<string, string> {
  return {
    "gen_ai.system": span.vendor || "—",
    "gen_ai.request.model": span.model || "—",
    "gen_ai.response.model": span.responseModel || span.model || "—",
    "gen_ai.usage.input_tokens": String(span.inputTokens),
    "gen_ai.usage.output_tokens": String(span.outputTokens),
    "gen_ai.cost": `$${span.cost.toFixed(4)}`,
    "gen_ai.kind": span.kind || "span",
  };
}

function llmResourceAttributes(detail: LlmTraceDetail, span: LlmSpan): Record<string, string> {
  const attributes: Record<string, string> = { "service.name": span.service || detail.service };
  if (detail.environment) attributes["deployment.environment"] = detail.environment;
  if (detail.userId) attributes["user.id"] = detail.userId;
  if (detail.sessionId) attributes["session.id"] = detail.sessionId;
  if (detail.release) attributes["service.version"] = detail.release;
  return attributes;
}

function resolveSpanIO(detail: LlmTraceDetail, span: LlmSpan, options?: LlmTraceAdapterOptions) {
  const fullIO = options?.spanIO?.[span.spanId];
  if ((span.promptTruncated || span.completionTruncated) && !fullIO) {
    options?.onSpanIONeeded?.(span.spanId);
  }
  const prompt = fullIO?.prompt || span.prompt || detail.prompt;
  const completion = fullIO?.completion || span.completion || detail.output;
  return {
    prompt: markTruncated(prompt, !fullIO && !!span.promptTruncated),
    completion: markTruncated(completion, !fullIO && !!span.completionTruncated),
  };
}

function spanAttributes(
  detail: LlmTraceDetail,
  span: LlmSpan,
  options?: LlmTraceAdapterOptions
): SpanAttributes {
  const attributes = genAIAttributes(span);
  const io = resolveSpanIO(detail, span, options);
  return {
    spanId: span.spanId,
    traceId: detail.traceId,
    operationName: span.name || span.operation,
    serviceName: span.service || detail.service,
    attributesString: attributes,
    resourceAttributes: llmResourceAttributes(detail, span),
    exceptionMessage: span.hasError ? "LLM execution returned an error." : undefined,
    llmPrompt: io.prompt,
    llmCompletion: io.completion,
    llmVendor: span.vendor,
    llmModel: span.responseModel || span.model,
    llmInputTokens: span.inputTokens,
    llmOutputTokens: span.outputTokens,
    llmCost: span.cost,
    llmScores: detail.scores,
  };
}

function spanAttributesGetter(
  detail: LlmTraceDetail,
  spans: readonly LlmSpan[],
  options?: LlmTraceAdapterOptions
): (spanId: string) => SpanAttributes | null {
  const byID = new Map(spans.map((span) => [span.spanId, span]));
  return (spanId) => {
    const span = byID.get(spanId) ?? spans[0];
    return span ? spanAttributes(detail, span, options) : null;
  };
}

export function adaptLlmTraceToShared(
  detail: LlmTraceDetail,
  options?: LlmTraceAdapterOptions
): {
  traceId: string;
  spans: TraceRecord[];
  stats: {
    totalSpans: number;
    errors: number;
    services: Set<string>;
    durationMs: number;
  };
  traceTimeBounds: {
    startMs: number;
    endMs: number;
  };
  getSpanAttributes: (spanId: string) => SpanAttributes | null;
} {
  const spansSrc = sourceSpans(detail);
  const services = new Set<string>();
  let errorCount = 0;
  const spans = spansSrc.map((span, index) => {
    services.add(span.service || detail.service);
    if (span.hasError) errorCount++;
    return toTraceRecord(detail, span, index);
  });

  return {
    traceId: detail.traceId,
    spans,
    stats: {
      totalSpans: spans.length,
      errors: errorCount,
      services,
      durationMs: detail.durationMs,
    },
    traceTimeBounds: {
      startMs: detail.startMs,
      endMs: detail.startMs + (detail.durationMs || 0),
    },
    getSpanAttributes: spanAttributesGetter(detail, spansSrc, options),
  };
}
