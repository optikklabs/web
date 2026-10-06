export type VisualizationTab = "waterfall" | "flame" | "errors" | "service_map" | "raw";

export interface SpanEvent {
  readonly spanId: string;
  readonly traceId: string;
  readonly eventName: string;
  readonly timestamp: string;
  readonly attributes: string;
}

interface SpanLink {
  readonly traceId: string;
  readonly spanId: string;
  readonly traceState?: string;
  readonly attributes?: Record<string, string>;
}

interface LlmScoreFact {
  readonly name: string;
  readonly value: number;
  readonly stringValue?: string | null;
  readonly source: string;
}

export interface SpanAttributes {
  readonly spanId: string;
  readonly traceId: string;
  readonly operationName: string;
  readonly serviceName: string;
  readonly attributesString: Record<string, string>;
  readonly resourceAttributes: Record<string, string>;
  readonly exceptionType?: string;
  readonly exceptionMessage?: string;
  readonly exceptionStacktrace?: string;
  readonly dbSystem?: string;
  readonly dbName?: string;
  readonly dbStatement?: string;
  readonly dbStatementNormalized?: string;
  readonly links?: readonly SpanLink[];

  // Extended LLM fields for LLM Observability span inspection
  readonly llmPrompt?: string | null;
  readonly llmCompletion?: string | null;
  readonly llmVendor?: string | null;
  readonly llmModel?: string | null;
  readonly llmInputTokens?: number | null;
  readonly llmOutputTokens?: number | null;
  readonly llmCost?: number | null;
  readonly llmScores?: readonly LlmScoreFact[] | null;
}

export interface RelatedTrace {
  readonly traceId: string;
  readonly spanId: string;
  readonly operationName: string;
  readonly serviceName: string;
  readonly durationMs: number;
  readonly status: string;
  readonly startTime: string;
}
