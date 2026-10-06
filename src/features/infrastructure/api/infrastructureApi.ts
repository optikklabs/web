import { z } from "zod";

import api from "@/shared/api/http/client";
import type { RequestTime } from "@/shared/api/service-types";
import { validateResponse } from "@/shared/api/utils/validate";

/** One row of `/infrastructure/{hosts,pods}/…/series` (seriesgroup.Point). */
const seriesPointSchema = z.object({
  timeBucket: z.string(),
  series: z.string(),
  value: z.number(),
});
export type SeriesPoint = z.infer<typeof seriesPointSchema>;

/** Fetches one metric group's series from a host or pod series endpoint. */
export async function getSeries(
  endpoint: string,
  metric: string,
  startTime: RequestTime,
  endTime: RequestTime
): Promise<SeriesPoint[]> {
  const res = await api.get<unknown>(endpoint, { params: { startTime, endTime, metric } });
  return validateResponse(z.array(seriesPointSchema), res);
}
