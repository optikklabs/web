import {
  DASHBOARD_DRAWER_PARAMS,
  buildDashboardDrawerSearch,
  buildLegacyDashboardDrawerSearch,
} from "@shared/components/ui/dashboard/utils/dashboardDrawerState";

export function buildServiceDrawerSearch(
  currentSearch: string | Record<string, unknown>,
  serviceName: string
): string {
  const row = { serviceName };

  return (
    buildDashboardDrawerSearch(
      currentSearch,
      { entity: "service", idField: "serviceName", titleField: "serviceName" },
      row
    ) ?? buildLegacyDashboardDrawerSearch(currentSearch, "service", serviceName, serviceName)
  );
}

function searchParamsToObject(searchParams: URLSearchParams): Record<string, string | string[]> {
  const search: Record<string, string | string[]> = {};

  for (const [key, value] of searchParams.entries()) {
    const currentValue = search[key];
    if (currentValue === undefined) {
      search[key] = value;
      continue;
    }

    if (Array.isArray(currentValue)) {
      currentValue.push(value);
      continue;
    }

    search[key] = [currentValue, value];
  }

  return search;
}

function clearServiceDrawerParams(searchParams: URLSearchParams): void {
  searchParams.delete(DASHBOARD_DRAWER_PARAMS.entity);
  searchParams.delete(DASHBOARD_DRAWER_PARAMS.id);
  searchParams.delete(DASHBOARD_DRAWER_PARAMS.title);
  searchParams.delete(DASHBOARD_DRAWER_PARAMS.data);
}

export function buildServiceTracesSearch(
  currentSearch: string | Record<string, unknown>,
  serviceName: string
): Record<string, string | string[]> {
  const searchInput =
    typeof currentSearch === "string" ? currentSearch : (currentSearch as Record<string, string>);
  const next = new URLSearchParams(searchInput);
  clearServiceDrawerParams(next);
  next.delete("view");
  next.delete("topologyFocus");
  next.delete("filters");
  next.delete("serviceName");
  next.set("service", serviceName);
  return searchParamsToObject(next);
}

export function buildServiceLogsSearch(
  currentSearch: string | Record<string, unknown>,
  serviceName: string
): Record<string, string | string[]> {
  const searchInput =
    typeof currentSearch === "string" ? currentSearch : (currentSearch as Record<string, string>);
  const next = new URLSearchParams(searchInput);
  clearServiceDrawerParams(next);
  next.delete("view");
  next.delete("topologyFocus");
  next.delete("service");
  next.delete("serviceName");
  next.set("filters", `serviceName:equals:${encodeURIComponent(serviceName)}`);
  return searchParamsToObject(next);
}
