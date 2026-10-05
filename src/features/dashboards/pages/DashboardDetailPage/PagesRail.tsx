import { Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

import { ROUTES } from "@/shared/constants/routes";
import { useAuthUser } from "@app/store/authStore";

import type { DashboardPage } from "@shared/dashboards/api/dashboardsApi";
import { useDashboardPagesList } from "@shared/dashboards/hooks/useDashboardPages";
import { CreatePageDrawer } from "../DashboardsPage/CreatePageDrawer";
import { pageIcon } from "../DashboardsPage/pageVisuals";

type RailTab = "all" | "mine" | "favorites";

const TABS: ReadonlyArray<{ id: RailTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "mine", label: "Mine" },
  { id: "favorites", label: "Favorites" },
];

interface PagesRailProps {
  readonly currentPageId: number;
}

/** 240px left nav to search and switch between dashboard pages. */
export function PagesRail({ currentPageId }: PagesRailProps) {
  const user = useAuthUser();
  const [tab, setTab] = useState<RailTab>("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const listQ = useDashboardPagesList({ q: search || undefined, limit: 100 });
  const pages = listQ.data?.items ?? [];

  const filtered =
    tab === "favorites"
      ? pages.filter((p) => p.isFavorite)
      : tab === "mine"
        ? pages.filter((p) => p.owner?.name && p.owner.name === user?.name)
        : pages;

  const favorites = filtered.filter((p) => p.isFavorite);
  const rest = filtered.filter((p) => !p.isFavorite);

  return (
    <div className="flex min-h-0 flex-col gap-3 border-border border-r bg-card/40 p-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[11px] text-foreground-muted uppercase tracking-wide">
          Pages
        </span>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          title="New page"
          className="flex h-6 w-6 items-center justify-center rounded text-foreground-muted hover:bg-secondary hover:text-foreground"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="relative">
        <Search
          size={13}
          className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2 text-foreground-muted"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pages…"
          className="w-full rounded border border-border bg-background py-1.5 pr-2 pl-7 text-foreground text-xs outline-none focus:border-primary"
        />
      </div>

      <div className="flex overflow-hidden rounded border border-border">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 px-2 py-1 text-xs transition-colors ${
              tab === id
                ? "bg-[var(--color-primary-subtle-12)] font-semibold text-primary"
                : "bg-card text-foreground-muted hover:bg-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="-mr-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        <RailSection title="Favorites" pages={favorites} currentPageId={currentPageId} />
        <RailSection title="Pages" pages={rest} currentPageId={currentPageId} />
        {filtered.length === 0 && (
          <p className="px-1 py-2 text-foreground-muted text-xs">No pages found.</p>
        )}
      </div>

      <CreatePageDrawer open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}

/** A labeled group of page rows; renders nothing when empty. */
function RailSection({
  title,
  pages,
  currentPageId,
}: {
  readonly title: string;
  readonly pages: DashboardPage[];
  readonly currentPageId: number;
}) {
  if (pages.length === 0) return null;
  return (
    <div>
      <div className="mb-1 px-1 font-semibold text-[10px] text-foreground-muted uppercase tracking-wide">
        {title}
      </div>
      <div className="flex flex-col gap-0.5">
        {pages.map((page) => (
          <PageRow key={page.id} page={page} active={page.id === currentPageId} />
        ))}
      </div>
    </div>
  );
}

/** Single page row linking to its detail route, highlighted when active. */
function PageRow({ page, active }: { readonly page: DashboardPage; readonly active: boolean }) {
  const Icon = pageIcon(page.icon);
  return (
    <Link
      to={ROUTES.dashboardDetail}
      params={{ pageId: String(page.id) }}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm no-underline transition-colors ${
        active
          ? "bg-[var(--color-primary-subtle-12)] font-semibold text-primary"
          : "text-foreground-secondary hover:bg-secondary"
      }`}
    >
      <Icon size={14} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{page.name}</span>
      <span className="shrink-0 font-mono text-foreground-muted text-xs">{page.widgetCount}</span>
    </Link>
  );
}
