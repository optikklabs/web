import type { ErrorTimeSeriesPoint } from "@shared/api/errors";
import type { LatencyPercentilesPoint, StatusTimeseriesPoint } from "@shared/api/red/redApi";
import type { ServiceTopologyEdge } from "@shared/api/topology";
import type { DependencyRow, EndpointRow, ServiceSummarySnapshot } from "./types";

function normalizeServiceKey(value: string): string {
  return value.trim().toLowerCase();
}

export function readNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function buildInitialSummary(
  data: Record<string, unknown> | null | undefined
): ServiceSummarySnapshot | null {
  if (!data) {
    return null;
  }

  const requestCount = readNumber(data.requestCount) ?? 0;
  const errorCount = readNumber(data.errorCount) ?? 0;
  const explicitErrorRate = readNumber(data.errorRate);

  return {
    requestCount,
    errorCount,
    errorRate: explicitErrorRate ?? (requestCount > 0 ? (errorCount * 100) / requestCount : 0),
    avgLatency: readNumber(data.avgLatency) ?? 0,
    p95Latency: readNumber(data.p95Latency) ?? 0,
    p99Latency: readNumber(data.p99Latency) ?? 0,
  };
}

export function buildDependencyRows(
  edges: readonly ServiceTopologyEdge[],
  serviceName: string,
  direction: "upstream" | "downstream"
): DependencyRow[] {
  const normalizedServiceName = normalizeServiceKey(serviceName);

  return edges
    .filter((edge) =>
      direction === "upstream"
        ? normalizeServiceKey(edge.target) === normalizedServiceName
        : normalizeServiceKey(edge.source) === normalizedServiceName
    )
    .sort((left, right) => Number(right.callCount ?? 0) - Number(left.callCount ?? 0))
    .slice(0, 6)
    .map((edge) => ({
      id: `${direction}:${edge.source}->${edge.target}`,
      serviceName: direction === "upstream" ? edge.source : edge.target,
      callCount: Number(edge.callCount ?? 0),
      p95LatencyMs: Number(edge.p95LatencyMs ?? 0),
    }));
}

export function buildLatencyTrendSeries(points: readonly LatencyPercentilesPoint[]) {
  return points.map((point) => ({
    timestamp: point.timestampMs,
    p50Ms: point.p50Ms,
    p95Ms: point.p95Ms,
    p99Ms: point.p99Ms,
  }));
}

export function buildRequestTrendSeries(points: readonly StatusTimeseriesPoint[]) {
  return points.map((point) => {
    const total =
      (point.status2xx ?? 0) +
      (point.status4xx ?? 0) +
      (point.status5xx ?? 0) +
      (point.statusOther ?? 0);
    return {
      timestamp: point.timestampMs,
      requestCount: total,
    };
  });
}

export function buildErrorTrendSeries(points: readonly ErrorTimeSeriesPoint[]) {
  return points.map((point) => {
    const requests = point.requestCount ?? 0;
    const errors = point.errorCount ?? 0;
    return {
      timestamp: point.timestampMs,
      requestCount: requests,
      errorCount: errors,
      errorRate: requests > 0 ? (errors / requests) * 100 : 0,
    };
  });
}

export { healthVariantForErrorRate, healthLabelForErrorRate } from "@shared/utils/statusUtils";

export function formatEndpointLabel(
  row: Pick<EndpointRow, "endpointName" | "operationName">
): string {
  const endpointName = row.endpointName?.trim();
  const operationName = row.operationName.trim();

  if (endpointName) {
    return endpointName;
  }

  if (operationName && !operationName.startsWith("/")) {
    return operationName;
  }

  return operationName || "Route unavailable";
}

export function formatEndpointMeta(
  row: Pick<EndpointRow, "endpointName" | "operationName">
): string | null {
  const endpointName = row.endpointName?.trim();
  const operationName = row.operationName.trim();

  if (endpointName && operationName && endpointName !== operationName) {
    return `Span: ${operationName}`;
  }

  if (!endpointName && operationName) {
    return operationName === formatEndpointLabel(row)
      ? "Route label unavailable in spans"
      : `Span: ${operationName}`;
  }

  return null;
}
