import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";

import { ROUTES } from "@/shared/constants/routes";
import { Modal } from "@shared/components/primitives/ui/dialog";
import { DropdownMenu, DropdownMenuItem } from "@shared/components/primitives/ui/dropdown-menu";
import { cn } from "@shared/lib/utils";

import type { DashboardPage } from "@shared/dashboards/api/dashboardsApi";
import { useDeleteDashboardPage } from "@shared/dashboards/hooks/useDashboardMutations";
import { pageIcon } from "./pageVisuals";

interface PageCardProps {
  readonly page: DashboardPage;
}

export function PageCard({ page }: PageCardProps) {
  const Icon = pageIcon(page.icon);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deletePage = useDeleteDashboardPage();
  const widgetLabel =
    page.widgetCount === 0
      ? "Empty page · no widgets yet"
      : `${page.widgetCount} widget${page.widgetCount === 1 ? "" : "s"}`;

  return (
    <div className="group relative">
      <div
        className={cn(
          "absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100",
          menuOpen && "opacity-100"
        )}
      >
        <DropdownMenu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          trigger={
            <button
              type="button"
              title="Page actions"
              className="flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground-muted hover:bg-secondary hover:text-foreground"
            >
              <MoreHorizontal size={14} />
            </button>
          }
        >
          <DropdownMenuItem
            className="text-error"
            onSelect={() => {
              setMenuOpen(false);
              setConfirmOpen(true);
            }}
          >
            <Trash2 size={13} className="mr-2" />
            Delete page
          </DropdownMenuItem>
        </DropdownMenu>
      </div>

      <Link
        to={ROUTES.dashboardDetail}
        params={{ pageId: String(page.id) }}
        className="flex min-h-[180px] flex-col overflow-hidden rounded-lg border border-border bg-card no-underline transition-colors hover:border-primary/50"
      >
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-subtle-12)] text-primary">
              <Icon size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-foreground text-sm">{page.name}</div>
              <div className="mt-0.5 text-foreground-muted text-xs">{widgetLabel}</div>
            </div>
            {page.isFavorite && <Star size={14} className="shrink-0 fill-warning text-warning" />}
          </div>

          {page.description && (
            <div className="line-clamp-2 min-h-[2rem] text-foreground-secondary text-xs leading-5">
              {page.description}
            </div>
          )}

          <div className="mt-0.5 flex flex-wrap gap-1">
            {page.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-foreground-secondary"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {page.owner && (
          <div className="flex items-center gap-2 border-border border-t bg-secondary/40 px-4 py-2.5">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--color-primary-subtle-25)] font-bold text-[11px] text-primary">
              {page.owner.initials}
            </span>
            <span className="text-foreground-muted text-xs">{page.owner.name}</span>
          </div>
        )}
      </Link>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete page"
        width={420}
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded border border-border bg-card px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deletePage.isPending}
              onClick={() => deletePage.mutate(page.id, { onSuccess: () => setConfirmOpen(false) })}
              className="rounded bg-error px-3 py-1.5 font-medium text-sm text-white hover:bg-error disabled:opacity-60"
            >
              {deletePage.isPending ? "Deleting…" : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-foreground-secondary text-sm">
          Delete <span className="font-medium text-foreground">{page.name}</span>?
          {page.widgetCount > 0 &&
            ` This permanently removes the page and its ${page.widgetCount} widget${page.widgetCount === 1 ? "" : "s"}.`}{" "}
          This cannot be undone.
        </p>
        {deletePage.error && <p className="mt-2 text-error text-xs">{deletePage.error.message}</p>}
      </Modal>
    </div>
  );
}

interface CreatePageTileProps {
  readonly onClick: () => void;
}

export function CreatePageTile({ onClick }: CreatePageTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-lg border border-primary/40 border-dashed bg-[var(--color-primary-subtle-08)] p-4 text-center transition-colors hover:bg-[var(--color-primary-subtle-12)]"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-primary-subtle-12)] text-primary">
        <Plus size={20} />
      </span>
      <span className="font-semibold text-primary text-sm">Create page</span>
      <span className="max-w-[220px] text-foreground-muted text-xs leading-5">
        Empty by default. Add widgets after creating — each one powered by its own query.
      </span>
    </button>
  );
}
