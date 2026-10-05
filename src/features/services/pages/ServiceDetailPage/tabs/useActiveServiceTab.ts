import { useNavigate, useSearch } from "@tanstack/react-router";

export const SERVICE_TAB_IDS = ["overview", "errors", "traces", "logs", "dependencies"] as const;

export type ServiceTabId = (typeof SERVICE_TAB_IDS)[number];

const DEFAULT_TAB: ServiceTabId = "overview";

function normalizeTab(value: string | null | undefined): ServiceTabId {
  if (!value) return DEFAULT_TAB;
  return (SERVICE_TAB_IDS as readonly string[]).includes(value)
    ? (value as ServiceTabId)
    : DEFAULT_TAB;
}

export function useActiveServiceTab(): {
  tab: ServiceTabId;
  setTab: (next: ServiceTabId) => void;
} {
  const search = useSearch({ from: "/_app/services/$serviceName" });
  const navigate = useNavigate();
  const tab = normalizeTab(search.tab);
  const setTab = (next: ServiceTabId) => {
    navigate({
      search: ((prev: Record<string, unknown>) => ({
        ...prev,
        tab: next === DEFAULT_TAB ? undefined : next,
      })) as never,
    });
  };
  return { tab, setTab };
}
