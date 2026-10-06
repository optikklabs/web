export interface ServiceDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  serviceName: string;
  title?: string | null;
}

export interface ServiceSummarySnapshot {
  requestCount: number;
  errorCount: number;
  errorRate: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
}

export interface DependencyRow {
  id: string;
  serviceName: string;
  callCount: number;
  p95LatencyMs: number;
}

export interface EndpointRow {
  id: string;
  serviceName: string;
  operationName: string;
  endpointName?: string;
  httpMethod: string;
  requestCount: number;
  errorCount: number;
  p50Latency: number;
  p95Latency: number;
}
