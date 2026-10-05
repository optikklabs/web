import { useLocation, useNavigate } from "@tanstack/react-router";
import { ChevronsLeft, ChevronsRight, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";

import { NAV_GROUPS, getDomainNavigationItems } from "@/app/registry/domainRegistry";
import { OptikkLogo } from "@/shared/components/brand/OptikkLogo";
import { ROUTES } from "@/shared/constants/routes";
import { Tooltip } from "@shared/components/primitives/ui/tooltip";
import { cn } from "@shared/lib/utils";

import { session } from "@shared/api/auth/session";

import { useAppStore, useSidebarCollapsed } from "@app/store/appStore";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarCollapsed = useSidebarCollapsed();
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  const navEntries = getDomainNavigationItems().map((entry) => ({
    path: entry.path,
    label: entry.label,
    group: entry.group,
    iconNode: <entry.icon size={18} />,
  }));

  const pinnedItems = navEntries.filter((entry) => entry.group === "pinned");

  const getSelectedKey = () => {
    const pathname = location.pathname;
    const matchedEntry = navEntries.find(
      (entry) => pathname === entry.path || pathname.startsWith(`${entry.path}/`)
    );
    return matchedEntry?.path || pathname;
  };

  const selectedKey = getSelectedKey();
  const isSettingsActive = selectedKey === ROUTES.settings;

  const handleLogout = async () => {
    await session.logout();
    toast.success("Logged out successfully");
    navigate({ to: ROUTES.login as string & {} });
  };

  const navItemClass = (isActive: boolean, extra?: string) =>
    cn(
      "flex w-full items-center gap-[var(--space-sm)] whitespace-nowrap rounded-[var(--card-radius)] border border-transparent bg-transparent px-[var(--space-sm)] py-2 text-left font-medium text-[13px] text-foreground-secondary transition-[background-color,border-color,color,box-shadow]",
      "hover:bg-white/5 hover:text-foreground",
      isActive &&
        "border-[var(--color-primary-subtle-20)] bg-[var(--color-primary-subtle-12)] text-foreground shadow-[var(--shadow-sm)] hover:bg-[var(--color-primary-subtle-14)]",
      sidebarCollapsed && "justify-center px-[7px]",
      extra
    );

  const renderNavGroup = (label: string | undefined, items: typeof navEntries) => (
    <div className="mb-[var(--space-xs)]" key={label}>
      {!sidebarCollapsed && label && (
        <div className="px-[var(--space-xs)] pt-[var(--space-xs)] pb-[var(--space-2xs)] font-semibold text-[9px] text-[var(--text-caption,var(--text-muted))] uppercase leading-[22px] tracking-[0.7px]">
          {label}
        </div>
      )}
      {items.map((item) => {
        const isActive = selectedKey === item.path;
        const button = (
          <button
            type="button"
            key={item.path}
            className={navItemClass(isActive)}
            onClick={() => navigate({ to: item.path as string & {} })}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="inline-flex shrink-0 items-center">{item.iconNode}</span>
            {!sidebarCollapsed && (
              <span className="overflow-hidden text-ellipsis">{item.label}</span>
            )}
          </button>
        );

        if (sidebarCollapsed) {
          return (
            <Tooltip key={item.path} content={item.label} placement="right">
              {button}
            </Tooltip>
          );
        }
        return button;
      })}
    </div>
  );

  return (
    <aside
      className={cn(
        "fixed top-0 bottom-0 left-0 z-30 flex h-screen w-[var(--space-sidebar-w,220px)] flex-col border-border border-r bg-secondary shadow-[var(--shadow-md)] transition-[width] duration-200",
        sidebarCollapsed && "w-[var(--space-sidebar-collapsed,56px)]"
      )}
    >
      <button
        type="button"
        className={cn(
          "flex h-[var(--space-header-h,56px)] w-full shrink-0 cursor-pointer items-center justify-center gap-3 border-border border-x-0 border-t-0 border-b bg-transparent px-[var(--space-lg)]",
          sidebarCollapsed && "px-0"
        )}
        onClick={() => navigate({ to: ROUTES.overview })}
      >
        <OptikkLogo size={32} className="block shrink-0" />
        {!sidebarCollapsed && (
          <span className="whitespace-nowrap font-semibold text-[14px] text-foreground">
            Optikk
          </span>
        )}
      </button>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <nav
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-[var(--space-xs)]"
          aria-label="Main navigation"
        >
          {renderNavGroup(undefined, pinnedItems)}
          {NAV_GROUPS.map((group) =>
            renderNavGroup(
              group.label,
              navEntries.filter((entry) => entry.group === group.key)
            )
          )}
        </nav>

        <div className="shrink-0 border-border border-t">
          <div className="p-[var(--space-xs)]">
            <button
              type="button"
              className={cn(
                "mb-[var(--space-xs)] flex w-full items-center gap-[var(--space-xs)] rounded-[var(--card-radius)] border border-transparent bg-transparent px-[var(--space-sm)] py-2 text-left font-medium text-[12px] text-foreground-secondary transition-[background-color,border-color,color,box-shadow]",
                "hover:bg-white/5 hover:text-foreground",
                isSettingsActive &&
                  "border-[var(--color-primary-subtle-20)] bg-[var(--color-primary-subtle-12)] text-foreground shadow-[var(--shadow-sm)] hover:bg-[var(--color-primary-subtle-14)]",
                sidebarCollapsed && "justify-center px-1.5"
              )}
              onClick={() => navigate({ to: ROUTES.settings as string & {} })}
              aria-current={isSettingsActive ? "page" : undefined}
            >
              <Settings size={14} />
              {!sidebarCollapsed && "Settings"}
            </button>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-[var(--space-xs)] rounded-[var(--card-radius)] px-[var(--space-sm)] py-2 text-left font-medium text-[12px] transition-[background-color,border-color,color]",
                "border border-border-light bg-transparent text-foreground-secondary hover:border-border hover:bg-accent hover:text-foreground",
                sidebarCollapsed && "justify-center px-1.5"
              )}
              onClick={handleLogout}
            >
              <LogOut size={14} />
              {!sidebarCollapsed && "Logout"}
            </button>
          </div>

          <button
            type="button"
            className="flex h-10 w-full items-center justify-center border-border border-t border-none bg-transparent text-foreground-muted transition-colors hover:bg-white/[0.04] hover:text-foreground"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
