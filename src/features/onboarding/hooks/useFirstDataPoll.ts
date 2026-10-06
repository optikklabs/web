import { useEffect, useState } from "react";

import { type IngestionOverview, getIngestionOverview } from "@shared/api/ingestion";
import { useStandardQuery } from "@shared/hooks/useStandardQuery";

const POLL_INTERVAL_MS = 5_000;
const HINT_AFTER_MS = 2 * 60_000;
const GIVE_UP_AFTER_MS = 15 * 60_000;
const LOOKBACK_MS = 60 * 60_000;

interface FirstData {
  readonly records: number;
  readonly spans: number;
  readonly service: string | null;
}

export type FirstDataState =
  | { readonly phase: "waiting"; readonly showHint: boolean }
  | { readonly phase: "received"; readonly data: FirstData }
  | { readonly phase: "gaveUp" };

function toFirstData(overview: IngestionOverview | undefined): FirstData | null {
  if (overview === undefined || overview.summary.totals.records <= 0) {
    return null;
  }
  return {
    records: overview.summary.totals.records,
    spans: overview.summary.totals.spans,
    service: overview.services.services[0]?.name ?? null,
  };
}

/**
 * Polls the ingestion overview every 5s (for up to 15 min) until the tenant
 * has received any telemetry. Ingestion stats flush every ~5 min, so a
 * correctly wired app can still take a few minutes to show up here.
 */
export function useFirstDataPoll(): FirstDataState {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);

  const { data } = useStandardQuery({
    queryKey: ["onboarding", "first-data", startedAt],
    queryFn: ({ signal }) => getIngestionOverview(startedAt - LOOKBACK_MS, Date.now(), signal),
    refetchInterval: (query) => {
      const expired = Date.now() - startedAt >= GIVE_UP_AFTER_MS;
      return toFirstData(query.state.data) != null || expired ? false : POLL_INTERVAL_MS;
    },
    gcTime: 0,
  });

  const first = toFirstData(data);

  // Drives the hint / give-up transitions, which depend on wall time only.
  useEffect(() => {
    if (first != null || now - startedAt >= GIVE_UP_AFTER_MS) {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [first, now, startedAt]);

  if (first != null) {
    return { phase: "received", data: first };
  }
  if (now - startedAt >= GIVE_UP_AFTER_MS) {
    return { phase: "gaveUp" };
  }
  return { phase: "waiting", showHint: now - startedAt >= HINT_AFTER_MS };
}
