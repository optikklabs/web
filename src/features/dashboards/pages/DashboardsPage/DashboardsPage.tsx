import { LayoutGrid, List, Plus, Upload } from "lucide-react";
import { useMemo, useState } from "react";

import EmptyState from "@shared/components/ui/feedback/EmptyState";
import SearchInput from "@shared/components/ui/forms/SearchInput";
import PageHeader from "@shared/components/ui/layout/PageHeader";
import { PageShell } from "@shared/components/ui/layout/PageShell";

import type { DashboardPage, ListDashboardPagesParams } from "@shared/dashboards/api/dashboardsApi";
import { useDashboardPagesList } from "@shared/dashboards/hooks/useDashboardPages";
import { CatalogLeftRail, type CatalogView } from "./CatalogLeftRail";
import { CreatePageDrawer } from "./CreatePageDrawer";
import { CreatePageTile, PageCard } from "./PageCard";

type SortKey = "modified" | "name";
type Layout = "grid" | "list";

function sortPages(pages: DashboardPage[], sort: SortKey): DashboardPage[] {
  if (sort === "name") {
    return [...pages].sort((a, b) => a.name.localeCompare(b.name));
  }
  return pages;
}

// Tags + counts derived from the current result set for the left-rail filter.
function deriveTags(pages: DashboardPage[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const page of pages) {
    for (const tag of page.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export default function DashboardsPage() {
  const [view, setView] = useState<CatalogView>("all");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout>("grid");
  const [sort, setSort] = useState<SortKey>("modified");
  const [showCreate, setShowCreate] = useState(false);

  const params = useMemo<ListDashboardPagesParams>(
    () => ({
      q: search || undefined,
      favorite: view === "favorites" || undefined,
      tag: tag || undefined,
      limit: 100,
    }),
    [search, view, tag]
  );

  const listQ = useDashboardPagesList(params);
  const pages = sortPages(listQ.data?.items ?? [], sort);
  const tags = useMemo(() => deriveTags(listQ.data?.items ?? []), [listQ.data]);
  const total = listQ.data?.total ?? 0;

  return (
    <PageShell>
      <PageHeader
        title="Custom dashboards"
        subtitle={`Pages are containers — open one, then build widgets powered by curated queries. ${total} page${total === 1 ? "" : "s"} in this workspace.`}
        icon={<LayoutGrid size={22} />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-foreground text-sm hover:bg-secondary"
            >
              <Upload size={14} />
              Import
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 font-medium text-sm text-white hover:bg-primary"
            >
              <Plus size={14} />
              Create page
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-[240px_1fr] gap-6">
        <CatalogLeftRail view={view} onView={setView} tags={tags} activeTag={tag} onTag={setTag} />

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex items-center gap-3">
            <SearchInput
              placeholder="Search pages by name…"
              onSearch={setSearch}
              className="flex-1"
            />
            <div className="flex overflow-hidden rounded border border-border">
              {(
                [
                  ["grid", LayoutGrid],
                  ["list", List],
                ] as const
              ).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLayout(key)}
                  className={`flex h-8 w-8 items-center justify-center ${
                    layout === key
                      ? "bg-[var(--color-primary-subtle-12)] text-primary"
                      : "bg-card text-foreground-muted hover:bg-secondary"
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-8 rounded border border-border bg-card px-2 text-foreground text-sm outline-none"
            >
              <option value="modified">Recently modified</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>

          <div className="text-foreground-muted text-sm">
            {pages.length} page{pages.length === 1 ? "" : "s"}
            {tag && (
              <>
                {" "}
                · filtered by <span className="font-mono text-primary">#{tag}</span>
              </>
            )}
          </div>

          {listQ.isPending ? (
            <div className="grid grid-cols-3 gap-3.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[180px] animate-pulse rounded-lg bg-accent" />
              ))}
            </div>
          ) : pages.length === 0 ? (
            <EmptyState
              icon={<LayoutGrid size={40} className="text-foreground-muted opacity-40" />}
              title="No pages yet"
              description="Create your first page, then add widgets powered by curated queries."
              action={
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 font-medium text-sm text-white"
                >
                  <Plus size={14} />
                  Create page
                </button>
              }
            />
          ) : layout === "grid" ? (
            <div className="grid grid-cols-3 gap-3.5">
              <CreatePageTile onClick={() => setShowCreate(true)} />
              {pages.map((page) => (
                <PageCard key={page.id} page={page} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pages.map((page) => (
                <PageCard key={page.id} page={page} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreatePageDrawer open={showCreate} onOpenChange={setShowCreate} />
    </PageShell>
  );
}
