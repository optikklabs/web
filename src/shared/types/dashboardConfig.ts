import { z } from "zod";

export type DashboardDrawerEntity =
  | "databaseSystem"
  | "deployment"
  | "errorGroup"
  | "kafkaGroup"
  | "kafkaTopic"
  | "node"
  | "redisInstance"
  | "service";

// A saved metrics-builder widget. The backend validator (query
// dashboards/validate.go) accepts exactly these panel types, layout variants,
// aggregations and operators, and requires a metrics query.
const metricQuerySchema = z.object({
  id: z.string(),
  aggregation: z.enum(["avg", "sum", "min", "max", "count", "p50", "p95", "p99", "rate"]),
  metricName: z.string(),
  where: z.array(
    z.object({
      key: z.string(),
      operator: z.enum(["eq", "neq", "in", "not_in", "wildcard"]),
      value: z.union([z.string(), z.array(z.string())]),
    })
  ),
  groupBy: z.array(z.string()),
  spaceAggregation: z.enum(["avg", "sum", "min", "max"]),
});

const metricsQuerySpecSchema = z.object({
  kind: z.literal("metrics"),
  step: z.enum(["1m", "5m", "15m", "1h", "1d"]),
  spaceAggregation: z.enum(["avg", "sum", "min", "max"]),
  queries: z.array(metricQuerySchema).min(1),
  formulas: z.array(z.object({ id: z.string(), expression: z.string() })).optional(),
});

const layoutSchema = z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() });

export const dashboardPanelSpecSchema = z.object({
  id: z.string(),
  panelType: z.enum(["metrics-timeseries", "metrics-value", "metrics-toplist", "metrics-table"]),
  layoutVariant: z.enum(["standard-chart", "kpi", "ranking", "detail-table"]),
  query: metricsQuerySpecSchema,
  layout: layoutSchema,
  title: z.string(),
  legend: z.boolean(),
  smooth: z.boolean(),
});

export type DashboardMetricsQuerySpec = z.infer<typeof metricsQuerySpecSchema>;
export type DashboardLayout = z.infer<typeof layoutSchema>;
export type DashboardPanelSpec = z.infer<typeof dashboardPanelSpecSchema>;
export type DashboardPanelType = DashboardPanelSpec["panelType"];
export type DashboardLayoutVariant = DashboardPanelSpec["layoutVariant"];

export interface DashboardDrawerAction {
  entity: DashboardDrawerEntity;
  idField: string;
  titleField?: string;
}
