import api from "@/shared/api/http/client";
import { validateResponse } from "@/shared/api/utils/validate";
import { API_CONFIG } from "@config/apiConfig";
import { z } from "zod";

/**
 * Canonical OTLP connection info, owned by the backend so the UI never
 * derives ingest endpoints from its own origin.
 */
const ingestionEndpointsSchema = z.object({
  /** Host:port for OTLP over gRPC, e.g. "ingest.optikk.in:4317". */
  grpc: z.string(),
  /** Base URL for OTLP over HTTP, e.g. "https://ingest.optikk.in:4318". */
  http: z.string(),
  /** Header carrying the tenant API key, e.g. "x-api-key". */
  headerName: z.string(),
});

export type IngestionEndpoints = z.infer<typeof ingestionEndpointsSchema>;

export async function getIngestionEndpoints(): Promise<IngestionEndpoints> {
  return validateResponse(
    ingestionEndpointsSchema,
    await api.get<unknown>(`${API_CONFIG.ENDPOINTS.V1_BASE}/tenants/current/ingestion-endpoints`)
  );
}
