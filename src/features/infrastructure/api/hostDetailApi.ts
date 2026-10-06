import { z } from "zod";

import api from "@/shared/api/http/client";
import type { RequestTime } from "@/shared/api/service-types";
import { validateResponse } from "@/shared/api/utils/validate";
import { API_CONFIG } from "@config/apiConfig";

const V1 = API_CONFIG.ENDPOINTS.V1_BASE;

/** Host machine metadata from retained resource attributes. */
const hostAboutSchema = z.object({
  osType: z.string().optional(),
  osDescription: z.string().optional(),
  arch: z.string().optional(),
  hostId: z.string().optional(),
  cloudProvider: z.string().optional(),
  cloudPlatform: z.string().optional(),
  cloudRegion: z.string().optional(),
  cloudZone: z.string().optional(),
  k8sNodeName: z.string().optional(),
});
export type HostAbout = z.infer<typeof hostAboutSchema>;

/**
 * Mirrors models.HostOverview. Null KPIs (and lastSeen) mean the host
 * reported no metrics for them in the window.
 */
const hostOverviewSchema = z.object({
  host: z.string(),
  lastSeen: z.string().nullable(),
  environments: z.array(z.string()),
  namespaces: z.array(z.string()),
  cpuPct: z.number().nullable(),
  memoryPct: z.number().nullable(),
  diskPct: z.number().nullable(),
  load1m: z.number().nullable(),
  load5m: z.number().nullable(),
  load15m: z.number().nullable(),
  processCount: z.number().nullable(),
  availableMetrics: z.array(z.string()),
  about: hostAboutSchema.optional(),
});
export type HostOverview = z.infer<typeof hostOverviewSchema>;

export type HostMetricGroup =
  | "cpu"
  | "load"
  | "memory"
  | "disk_io"
  | "filesystem"
  | "network_io"
  | "network_errors";

export async function getHostOverview(
  host: string,
  startTime: RequestTime,
  endTime: RequestTime
): Promise<HostOverview> {
  const res = await api.get<unknown>(
    `${V1}/infrastructure/hosts/${encodeURIComponent(host)}/overview`,
    { params: { startTime, endTime } }
  );
  return validateResponse(hostOverviewSchema, res);
}

/** Series endpoint for InfraMultiSeriesChart; pass `metric` via extraParams. */
export function hostSeriesEndpoint(host: string): string {
  return `${V1}/infrastructure/hosts/${encodeURIComponent(host)}/series`;
}
