import { Outlet } from "@tanstack/react-router";
import { Suspense, lazy, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { DensityProvider } from "@shared/components/primitives/ui/providers/DensityProvider";
import ErrorBoundary from "@shared/components/ui/feedback/ErrorBoundary";
import ShortcutHelpOverlay from "@shared/components/ui/overlay/ShortcutHelpOverlay";
import { useAppRefreshSubscriber } from "@shared/hooks/useAppRefreshSubscriber";
import { useKeyboardShortcuts } from "@shared/hooks/useKeyboardShortcuts";

import { useAppStore } from "@app/store/appStore";
import { cn } from "@shared/lib/utils";

import { TrialBanner } from "@/features/onboarding";

import Header from "./Header";
import Sidebar from "./Sidebar";

const CommandPalette = lazy(() =>
  import("./CommandPalette").then(({ CommandPalette }) => ({ default: CommandPalette }))
);

export default function MainLayout() {
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);
  const { shortcuts } = useKeyboardShortcuts();
  useAppRefreshSubscriber();

  useHotkeys(
    "shift+/",
    (e) => {
      e.preventDefault();
      setShortcutHelpOpen((prev) => !prev);
    },
    { enableOnFormTags: false }
  );

  return (
    <DensityProvider>
      <div className="h-screen bg-[var(--bg-primary,var(--literal-hex-0a0a0a-2))]">
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
        <Sidebar />
        <div
          className={cn(
            "flex h-screen flex-col transition-[margin-left] duration-200 ease-linear",
            "max-md:ml-0",
            sidebarCollapsed
              ? "ml-[var(--space-sidebar-collapsed,56px)]"
              : "ml-[var(--space-sidebar-w,220px)]"
          )}
        >
          <Header />
          <TrialBanner />
          <main
            className={cn(
              "p-4 max-md:p-3",
              "flex-1 overflow-y-auto",
              "bg-[var(--bg-primary,var(--literal-hex-0a0a0a-2))]",
              "relative z-[1]"
            )}
          >
            <ErrorBoundary showDetails={import.meta.env.DEV} boundaryName="main-content">
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
        <ShortcutHelpOverlay
          open={shortcutHelpOpen}
          onClose={() => setShortcutHelpOpen(false)}
          shortcuts={shortcuts}
        />
      </div>
    </DensityProvider>
  );
}
