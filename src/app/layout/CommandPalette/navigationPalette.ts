import { Columns2, RefreshCw, Settings, Sun } from "lucide-react";
import { createElement } from "react";

import type { PaletteAction } from "@/app/layout/CommandPalette/types";
import { getDomainNavigationItems } from "@/app/registry/domainRegistry";
import { useAppStore } from "@app/store/appStore";

// Hotkeys are a palette concern, keyed by destination path.
const NAV_HOTKEYS: Readonly<Record<string, string>> = {
  "/overview": "g h",
  "/metrics": "g m",
  "/logs": "g l",
  "/traces": "g t",
};

// Navigation entries are derived from the domain registry, so the palette
// always matches the sidebar without a parallel hand-maintained list.
const derivedNavigationActions: PaletteAction[] = getDomainNavigationItems().map((item) => ({
  id: `nav.${item.path.replace(/^\//, "").replace(/\//g, ".")}`,
  label: `Go to ${item.label}`,
  keywords: [item.label.toLowerCase(), item.group],
  group: "navigation",
  hotkey: NAV_HOTKEYS[item.path],
  icon: createElement(item.icon, { size: 16 }),
  perform: ({ navigate }) => {
    navigate(item.path);
  },
}));

export const navigationPaletteActions: PaletteAction[] = [
  ...derivedNavigationActions,
  {
    id: "nav.settings",
    label: "Go to Settings",
    keywords: ["settings", "preferences"],
    group: "navigation",
    icon: createElement(Settings, { size: 16 }),
    perform: ({ navigate }) => {
      navigate("/settings");
    },
  },
  {
    id: "app.refresh",
    label: "Refresh Data",
    keywords: ["refresh", "reload", "data"],
    group: "settings",
    icon: createElement(RefreshCw, { size: 16 }),
    perform: () => {
      useAppStore.getState().triggerRefresh();
    },
  },
  {
    id: "app.toggle-theme",
    label: "Toggle Theme",
    keywords: ["theme", "dark", "light"],
    group: "settings",
    icon: createElement(Sun, { size: 16 }),
    perform: () => {
      const { theme, setTheme } = useAppStore.getState();
      setTheme(theme === "dark" ? "light" : "dark");
    },
  },
  {
    id: "app.toggle-density",
    label: "Toggle Compact Mode",
    keywords: ["density", "compact", "comfortable"],
    group: "settings",
    icon: createElement(Columns2, { size: 16 }),
    perform: () => {
      const { viewPreferences, setViewPreference } = useAppStore.getState();
      const current = viewPreferences.density;
      setViewPreference("density", current === "comfortable" ? "compact" : "comfortable");
    },
  },
];
