import { type IngestionEndpoints, getIngestionEndpoints } from "@shared/api/ingestionEndpoints";
import { useStandardQuery } from "@shared/hooks/useStandardQuery";

/** The tenant's OTLP connection info; undefined until it has loaded. */
export function useIngestionEndpoints(): IngestionEndpoints | undefined {
  return useStandardQuery({
    queryKey: ["tenant", "ingestion-endpoints"],
    queryFn: () => getIngestionEndpoints(),
    staleTime: Number.POSITIVE_INFINITY,
  }).data;
}
