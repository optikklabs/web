import api from "@/shared/api/http/client";
import type { RequestTime } from "@/shared/api/service-types";
import { validateResponse } from "@/shared/api/utils/validate";
import { API_CONFIG } from "@config/apiConfig";
import { z } from "zod";

const V1 = API_CONFIG.ENDPOINTS.V1_BASE;

const summarySchema = z.object({
  totals: z.object({
    logs: z.number(),
    spans: z.number(),
    metricDatapoints: z.number(),
    records: z.number(),
    logsBytes: z.number(),
    spansBytes: z.number(),
    metricBytes: z.number(),
    bytes: z.number(),
  }),
  activeTimeseries: z.number(),
  topCardinalityMetric: z.object({ name: z.string(), timeseries: z.number() }),
  dailyAverage: z.number(),
  dailyAverageBytes: z.number(),
  peak: z.object({ date: z.string(), records: z.number(), bytes: z.number() }),
  daysElapsed: z.number(),
  daysInMonth: z.number(),
  commitmentRecords: z.number(),
  commitmentBytes: z.number(),
  commitmentUsedPct: z.number(),
  commitmentUsedBytesPct: z.number(),
  byType: z.array(
    z.object({
      type: z.string(),
      label: z.string(),
      records: z.number(),
      pct: z.number(),
      bytes: z.number(),
      bytesPct: z.number(),
    })
  ),
});

const costLineSchema = z.object({
  category: z.string(),
  unit: z.string(),
  quantity: z.number(),
  rate: z.number(),
  cost: z.number(),
});

const costSchema = z.object({
  currency: z.string(),
  lines: z.array(costLineSchema),
  currentCost: z.number(),
  daysElapsed: z.number(),
  daysInMonth: z.number(),
});

const timeseriesSeriesSchema = z.object({
  id: z.string(),
  label: z.string(),
  data: z.array(z.number()),
  byteData: z.array(z.number()),
});

const timeseriesSchema = z.object({
  groupBy: z.string(),
  dates: z.array(z.string()),
  series: z.array(timeseriesSeriesSchema),
});

const serviceRowSchema = z.object({
  name: z.string(),
  env: z.string(),
  logs: z.number(),
  spans: z.number(),
  timeseries: z.number(),
  total: z.number(),
  bytes: z.number(),
  pct: z.number(),
  bytesPct: z.number(),
  deltaPct: z.number(),
  spark: z.array(z.number()),
  byteSpark: z.array(z.number()),
});

const servicesSchema = z.object({
  services: z.array(serviceRowSchema),
  totalServices: z.number(),
  topSharePct: z.number(),
  topShareBytesPct: z.number(),
});

const overviewSchema = z.object({
  summary: summarySchema,
  cost: costSchema,
  timeseriesByType: timeseriesSchema,
  timeseriesByService: timeseriesSchema,
  services: servicesSchema,
});

export type IngestionSummary = z.infer<typeof summarySchema>;
export type CostLine = z.infer<typeof costLineSchema>;
export type IngestionCost = z.infer<typeof costSchema>;
export type TimeseriesSeries = z.infer<typeof timeseriesSeriesSchema>;
export type IngestionTimeseries = z.infer<typeof timeseriesSchema>;
export type IngestionServiceRow = z.infer<typeof serviceRowSchema>;
export type IngestionServices = z.infer<typeof servicesSchema>;
export type IngestionOverview = z.infer<typeof overviewSchema>;

/** Accepted-telemetry volume, cost and top services over [startTime, endTime]. */
export async function getIngestionOverview(
  startTime: RequestTime,
  endTime: RequestTime,
  signal?: AbortSignal
): Promise<IngestionOverview> {
  return validateResponse(
    overviewSchema,
    await api.get<unknown>(`${V1}/ingestion/overview`, { params: { startTime, endTime }, signal })
  );
}
