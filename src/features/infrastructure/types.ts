export interface InfrastructureNode {
  readonly host: string;
  readonly podCount: number;
  readonly services: readonly string[];
  readonly requestCount: number;
  readonly errorCount: number;
  readonly errorRate: number;
  readonly avgLatencyMs: number;
  readonly p95LatencyMs: number;
  readonly lastSeen: string;
}

/** Root-span aggregates per service seen on one host. */
export interface InfrastructureNodeService {
  readonly serviceName: string;
  readonly requestCount: number;
  readonly errorCount: number;
  readonly errorRate: number;
  readonly avgLatencyMs: number;
  readonly p95LatencyMs: number;
  readonly podCount: number;
}

export interface InfrastructureNodeSummary {
  readonly healthyNodes: number;
  readonly degradedNodes: number;
  readonly unhealthyNodes: number;
  readonly totalPods: number;
}

/** Root-span aggregates per Kubernetes pod name (see GET /v1/infrastructure/fleet/pods). */
export interface FleetPod {
  readonly podName: string;
  readonly host: string;
  readonly services: readonly string[];
  readonly requestCount: number;
  readonly errorCount: number;
  readonly errorRate: number;
  readonly avgLatencyMs: number;
  readonly p95LatencyMs: number;
  readonly lastSeen: string;
}

export interface MetricValue {
  readonly value: number;
}
