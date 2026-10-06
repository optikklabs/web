import { z } from "zod";

import api from "@/shared/api/http/client";
import { validateResponse } from "@/shared/api/utils/validate";
import { API_CONFIG } from "@config/apiConfig";
import type { MetricQueryDefinition, TimeStep } from "@shared/metrics/types";

export function buildExplorerQueryRequest(
  queries: MetricQueryDefinition[],
  startTime: number,
  endTime: number,
  step: TimeStep
): MetricExplorerQueryRequest {
  return {
    startTime,
    endTime,
    step,
    queries: queries
      .filter((q) => q.metricName)
      .map((q) => ({
        id: q.id,
        aggregation: q.aggregation,
        metricName: q.metricName,
        where: q.where.map((w) => ({ key: w.key, operator: w.operator, value: w.value })),
        groupBy: [...q.groupBy],
      })),
  };
}

const BASE = API_CONFIG.ENDPOINTS.V1_BASE;

const metricNameEntrySchema = z.object({
  name: z.string(),
  type: z.enum(["gauge", "counter", "histogram", "exponential_histogram", "summary"]),
  unit: z.string().optional(),
  description: z.string().optional(),
  temporality: z.string(),
  isMonotonic: z.boolean(),
});

const metricNamesResponseSchema = z.object({
  metrics: z.array(metricNameEntrySchema),
});

const metricTagSchema = z.object({
  key: z.string(),
  values: z.array(z.string()),
});

const metricTagsResponseSchema = z.object({
  tags: z.array(metricTagSchema),
});

const metricSeriesSchema = z.object({
  tags: z.record(z.string(), z.string()),
  // []*float64 on the Go side — gaps encode as null.
  values: z.array(z.number().nullable()),
});

const metricQueryResultSchema = z.object({
  timestamps: z.array(z.number()),
  series: z.array(metricSeriesSchema),
});

const metricsExplorerResponseSchema = z.object({
  results: z.record(z.string(), metricQueryResultSchema),
});

// Request types

export interface MetricNamesRequest {
  readonly startTime: number;
  readonly endTime: number;
  readonly search?: string;
}

export interface MetricTagsRequest {
  readonly metricName: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly tagKey?: string;
}

export interface MetricExplorerQueryRequest {
  readonly startTime: number;
  readonly endTime: number;
  readonly step: string;
  readonly queries: ReadonlyArray<{
    readonly id: string;
    readonly aggregation: string;
    readonly metricName: string;
    readonly where: ReadonlyArray<{
      readonly key: string;
      readonly operator: string;
      readonly value: string | string[];
    }>;
    readonly groupBy: string[];
  }>;
}

export type MetricNamesResponse = z.infer<typeof metricNamesResponseSchema>;
export type MetricTagsResponse = z.infer<typeof metricTagsResponseSchema>;
export type MetricsExplorerResponse = z.infer<typeof metricsExplorerResponseSchema>;

// Backend emits epoch-ms timestamps; the chart stack assumes epoch-seconds.
function toSecondsTimestamps(response: MetricsExplorerResponse): MetricsExplorerResponse {
  for (const result of Object.values(response.results)) {
    result.timestamps = result.timestamps.map((ts) => Math.floor(ts / 1000));
  }
  return response;
}

export const metricsExplorerApi = {
  async getMetricNames(params: MetricNamesRequest): Promise<MetricNamesResponse> {
    const { startTime, endTime, search } = params;
    const response = await api.get<unknown>(`${BASE}/metrics/names`, {
      params: { startTime, endTime, search: search || undefined },
    });
    return validateResponse(metricNamesResponseSchema, response);
  },

  async getMetricTags(params: MetricTagsRequest): Promise<MetricTagsResponse> {
    const { metricName, startTime, endTime, tagKey } = params;
    const response = await api.get<unknown>(
      `${BASE}/metrics/${encodeURIComponent(metricName)}/tags`,
      { params: { startTime, endTime, tagKey: tagKey || undefined } }
    );
    return validateResponse(metricTagsResponseSchema, response);
  },

  async query(
    body: MetricExplorerQueryRequest,
    signal?: AbortSignal
  ): Promise<MetricsExplorerResponse> {
    const response = await api.post<unknown>(`${BASE}/metrics/explorer/query`, body, { signal });
    const decoded = validateResponse(metricsExplorerResponseSchema, response);
    return toSecondsTimestamps(decoded);
  },
};
