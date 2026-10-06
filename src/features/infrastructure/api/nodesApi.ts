import { z } from "zod";

import api from "@/shared/api/http/client";
import type { RequestTime } from "@/shared/api/service-types";
import { validateResponse } from "@/shared/api/utils/validate";
import { API_CONFIG } from "@config/apiConfig";

import {
  type FleetPod,
  type InfrastructureNode,
  type InfrastructureNodeService,
  type InfrastructureNodeSummary,
  type MetricValue,
  fleetPodSchema,
  infrastructureNodeSchema,
  infrastructureNodeServiceSchema,
  infrastructureNodeSummarySchema,
  metricValueSchema,
} from "../types";

const V1 = API_CONFIG.ENDPOINTS.V1_BASE;

function range(s: RequestTime, e: RequestTime) {
  return { startTime: s, endTime: e };
}

export async function getNodes(s: RequestTime, e: RequestTime): Promise<InfrastructureNode[]> {
  const res = await api.get<unknown>(`${V1}/infrastructure/nodes`, { params: range(s, e) });
  return validateResponse(z.array(infrastructureNodeSchema), res);
}

export async function getNodesSummary(
  s: RequestTime,
  e: RequestTime
): Promise<InfrastructureNodeSummary> {
  const res = await api.get<unknown>(`${V1}/infrastructure/nodes/summary`, {
    params: range(s, e),
  });
  return validateResponse(infrastructureNodeSummarySchema, res);
}

export async function getNodeServices(
  host: string,
  s: RequestTime,
  e: RequestTime
): Promise<InfrastructureNodeService[]> {
  const res = await api.get<unknown>(
    `${V1}/infrastructure/nodes/${encodeURIComponent(host)}/services`,
    { params: range(s, e) }
  );
  return validateResponse(z.array(infrastructureNodeServiceSchema), res);
}

export async function getFleetPods(
  s: RequestTime,
  e: RequestTime,
  host?: string
): Promise<FleetPod[]> {
  const res = await api.get<unknown>(`${V1}/infrastructure/fleet/pods`, {
    params: { ...range(s, e), host },
  });
  return validateResponse(z.array(fleetPodSchema), res);
}

/** Fleet-wide average CPU or memory utilization. */
export async function getFleetAverage(
  metric: "cpu" | "memory",
  s: RequestTime,
  e: RequestTime
): Promise<MetricValue> {
  const res = await api.get<unknown>(`${V1}/infrastructure/${metric}/avg`, { params: range(s, e) });
  return validateResponse(metricValueSchema, res);
}
