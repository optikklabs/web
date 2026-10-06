import type { RequestTime } from "@/shared/api/service-types";

export type REDFiltersParams = {
  readonly startTime: RequestTime;
  readonly endTime: RequestTime;
  readonly services?: readonly string[];
  readonly [key: string]: RequestTime | string | readonly string[] | number | boolean | undefined;
};

/**
 * Builds the query parameters for RED endpoints: the window plus the
 * repeated `services` param (none means every service).
 */
export function buildREDFilters(
  s: RequestTime,
  e: RequestTime,
  services?: string | readonly string[],
  extra?: Partial<REDFiltersParams>
): REDFiltersParams {
  return {
    ...extra,
    startTime: s,
    endTime: e,
    services: typeof services === "string" ? [services] : services,
  };
}
