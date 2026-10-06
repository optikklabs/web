import { z } from "zod";

import type { RequestTime } from "@/shared/api/service-types";

import { getSaturation, rangeParams } from "./saturationClient";

const collectionSchema = z.object({
  name: z.string().min(1),
  queryCount: z.number().int().nonnegative(),
  callCount: z.number().int().nonnegative(),
  p95Ms: z.number().nonnegative().nullable(),
  p99Ms: z.number().nonnegative().nullable(),
});

const queryOptionSchema = z.object({
  queryHash: z.string().regex(/^[0-9a-f]{16}$/),
  queryLabel: z.string(),
  collectionName: z.string().min(1),
  callCount: z.number().int().nonnegative(),
  p95Ms: z.number().nonnegative().nullable(),
  p99Ms: z.number().nonnegative().nullable(),
});

const catalogueSchema = z.object({
  collections: z.array(collectionSchema),
  queries: z.array(queryOptionSchema),
  totalQueries: z.number().int().nonnegative(),
  truncated: z.boolean(),
});

const pointSchema = z.object({
  timeBucketMs: z.number().int().nonnegative(),
  p50Ms: z.number().nonnegative(),
  p95Ms: z.number().nonnegative(),
  p99Ms: z.number().nonnegative(),
  opsPerSec: z.number().nonnegative(),
});

const seriesSchema = z.object({
  queryHash: z.string().regex(/^[0-9a-f]{16}$/),
  queryLabel: z.string(),
  collectionName: z.string().min(1),
  callCount: z.number().int().nonnegative(),
  points: z.array(pointSchema),
});

const responseSchema = z.object({
  bucketSizeSeconds: z.number().int().positive(),
  series: z.array(seriesSchema),
  truncated: z.boolean(),
});

export type QueryPerformanceCatalogue = z.infer<typeof catalogueSchema>;
export type QueryPerformanceCollection = z.infer<typeof collectionSchema>;
export type QueryPerformanceResponse = z.infer<typeof responseSchema>;
export type QueryPerformanceSeries = z.infer<typeof seriesSchema>;

export function getQueryPerformanceCatalogue(
  dbSystem: string,
  startTime: RequestTime,
  endTime: RequestTime
): Promise<QueryPerformanceCatalogue> {
  return getSaturation("/saturation/database/query-performance/catalogue", catalogueSchema, {
    ...rangeParams(startTime, endTime),
    dbSystem,
  });
}

type SeriesScope =
  | {
      readonly dbSystem: string;
      readonly collection: string;
      readonly queryHash?: never;
      readonly limit: number;
    }
  | {
      readonly dbSystem: string;
      readonly collection?: never;
      readonly queryHash: string;
      readonly limit: number;
    };

export function getQueryPerformanceSeries(
  scope: SeriesScope,
  startTime: RequestTime,
  endTime: RequestTime
): Promise<QueryPerformanceResponse> {
  return getSaturation("/saturation/database/query-performance/series", responseSchema, {
    ...rangeParams(startTime, endTime),
    ...scope,
  });
}
