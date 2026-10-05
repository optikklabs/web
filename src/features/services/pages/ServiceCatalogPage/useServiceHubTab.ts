import { useNavigate, useSearch } from "@tanstack/react-router";

const SERVICE_HUB_TABS = ["catalog", "map"] as const;

export type ServiceHubTab = (typeof SERVICE_HUB_TABS)[number];

const DEFAULT_TAB: ServiceHubTab = "catalog";

function normalize(value: string | null | undefined): ServiceHubTab {
  if (!value) return DEFAULT_TAB;
  return (SERVICE_HUB_TABS as readonly string[]).includes(value)
    ? (value as ServiceHubTab)
    : DEFAULT_TAB;
}

export function useServiceHubTab(): {
  tab: ServiceHubTab;
  setTab: (next: ServiceHubTab) => void;
} {
  const search = useSearch({ from: "/_app/services/" });
  const navigate = useNavigate();
  const tab = normalize(search.tab);
  const setTab = (next: ServiceHubTab) => {
    navigate({
      to: "/services",
      search: (prev) => ({ ...prev, tab: next === DEFAULT_TAB ? undefined : next }),
    });
  };
  return { tab, setTab };
}
