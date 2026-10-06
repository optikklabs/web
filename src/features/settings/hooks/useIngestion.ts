import { getIngestionOverview } from "@shared/api/ingestion";
import { useStandardQuery } from "@shared/hooks/useStandardQuery";

// Ingestion is a billing-period view, so it ignores the global time selector
// and always reports the current calendar month to date (UTC).
function monthToDateRange(): { startTime: number; endTime: number; monthKey: string } {
  const now = new Date();
  const startTime = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const monthKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
  return { startTime, endTime: now.getTime(), monthKey };
}

export function useIngestionOverview() {
  const { startTime, endTime, monthKey } = monthToDateRange();
  return useStandardQuery({
    queryKey: ["ingestion", "overview", monthKey],
    queryFn: ({ signal }) => getIngestionOverview(startTime, endTime, signal),
    staleTime: 60_000,
  });
}
