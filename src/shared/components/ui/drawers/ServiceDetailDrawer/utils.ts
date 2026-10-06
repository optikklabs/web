import type { ErrorTimeSeriesPoint } from "@shared/api/errors";
import type { LatencyPercentilesPoint, StatusTimeseriesPoint } from "@shared/api/red/redApi";
import type { ServiceTopologyEdge } from "@shared/api/topology";
import type { DependencyRow, EndpointRow } from "./types";

function normalizeServiceKey(value: string): string {
  return value.trim().toLowerCase();
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
    .sort((left, right) => right.callCount - left.callCount)
    .slice(0, 6)
    .map((edge) => ({
      id: `${direction}:${edge.source}->${edge.target}`,
      serviceName: direction === "upstream" ? edge.source : edge.target,
      callCount: edge.callCount,
      p95LatencyMs: edge.p95LatencyMs,
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
    const total = point.status2xx + point.status4xx + point.status5xx + point.statusOther;
    return {
      timestamp: point.timestampMs,
      requestCount: total,
    };
  });
}

export function buildErrorTrendSeries(points: readonly ErrorTimeSeriesPoint[]) {
  return points.map((point) => {
    const requests = point.requestCount;
    const errors = point.errorCount;
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
