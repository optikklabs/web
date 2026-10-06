import { z } from "zod";

/** Mirrors models.InfrastructureNode. */
export const infrastructureNodeSchema = z.object({
  host: z.string(),
  podCount: z.number(),
  services: z.array(z.string()),
  requestCount: z.number(),
  errorCount: z.number(),
  errorRate: z.number(),
  avgLatencyMs: z.number(),
  p95LatencyMs: z.number(),
  lastSeen: z.string(),
});
export type InfrastructureNode = z.infer<typeof infrastructureNodeSchema>;

/** Root-span aggregates per service seen on one host. */
export const infrastructureNodeServiceSchema = z.object({
  serviceName: z.string(),
  requestCount: z.number(),
  errorCount: z.number(),
  errorRate: z.number(),
  avgLatencyMs: z.number(),
  p95LatencyMs: z.number(),
  podCount: z.number(),
});
export type InfrastructureNodeService = z.infer<typeof infrastructureNodeServiceSchema>;

export const infrastructureNodeSummarySchema = z.object({
  healthyNodes: z.number(),
  degradedNodes: z.number(),
  unhealthyNodes: z.number(),
  totalPods: z.number(),
});
export type InfrastructureNodeSummary = z.infer<typeof infrastructureNodeSummarySchema>;

/** Root-span aggregates per Kubernetes pod name (see GET /v1/infrastructure/fleet/pods). */
export const fleetPodSchema = z.object({
  podName: z.string(),
  host: z.string(),
  services: z.array(z.string()),
  requestCount: z.number(),
  errorCount: z.number(),
  errorRate: z.number(),
  avgLatencyMs: z.number(),
  p95LatencyMs: z.number(),
  lastSeen: z.string(),
});
export type FleetPod = z.infer<typeof fleetPodSchema>;

/** A fleet-wide percentage; null when nothing reported the metric. */
export const metricValueSchema = z.object({ value: z.number().nullable() });
export type MetricValue = z.infer<typeof metricValueSchema>;
