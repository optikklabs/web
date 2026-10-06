import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Check, Pencil, Plus, Star } from "lucide-react";
import { useState } from "react";

import { ROUTES } from "@/shared/constants/routes";
import { Modal } from "@shared/components/primitives/ui/dialog";
import EmptyState from "@shared/components/ui/feedback/EmptyState";
import Loading from "@shared/components/ui/feedback/Loading";

import type {
  CreateDashboardPagePayload,
  Dashboard,
  DashboardPageDetail,
} from "@shared/dashboards/api/dashboardsApi";
import {
  useDeleteWidget,
  useUpdateDashboardPage,
} from "@shared/dashboards/hooks/useDashboardMutations";
import { useDashboardPageDetail } from "@shared/dashboards/hooks/useDashboardPages";
import { pageIcon } from "../DashboardsPage/pageVisuals";
import { PagesRail } from "./PagesRail";
import { WidgetCard } from "./WidgetCard";
import { WidgetEditorModal } from "./WidgetEditorModal";

function pagePayload(
  page: DashboardPageDetail,
  overrides: Partial<CreateDashboardPagePayload>
): CreateDashboardPagePayload {
  return {
    name: page.name,
    description: page.description,
    icon: page.icon,
    iconColor: page.iconColor,
    tags: page.tags,
    isFavorite: page.isFavorite,
    ...overrides,
  };
}

export default function DashboardDetailPage() {
  const params = useParams({ strict: false }) as { pageId?: string };
  const pageId = params.pageId ? Number(params.pageId) : 0;

  const detailQ = useDashboardPageDetail(pageId);
  const removeWidget = useDeleteWidget(pageId);

  const [editing, setEditing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Dashboard | null>(null);
  const [widgetToDelete, setWidgetToDelete] = useState<Dashboard | null>(null);

  // Widget refresh follows the global auto-refresh (user's interval)
  // via the app-level refresh subscriber; no page-local timer.

  const page = detailQ.data;

  const openAdd = () => {
    setEditingWidget(null);
    setEditorOpen(true);
  };
  const openEdit = (widget: Dashboard) => {
    setEditingWidget(widget);
    setEditorOpen(true);
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-[240px_1fr]">
      <PagesRail currentPageId={pageId} />
      <div className="min-w-0 overflow-y-auto">
        {detailQ.isPending ? (
          <Loading />
        ) : detailQ.isError || !page ? (
          <div className="p-6">
            <EmptyState
              title="Page not found"
              description="This dashboard page could not be loaded."
              action={
                <Link
                  to={ROUTES.dashboards}
                  className="rounded bg-primary px-3 py-1.5 font-medium text-sm text-white no-underline"
                >
                  Back to dashboards
                </Link>
              }
            />
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-5 p-6">
            <Link
              to={ROUTES.dashboards}
              className="flex w-fit items-center gap-1.5 text-foreground-muted text-sm no-underline hover:text-foreground"
            >
              <ArrowLeft size={14} />
              All dashboards
            </Link>

            <DetailHeader
              key={page.id}
              page={page}
              editing={editing}
              onToggleEditing={() => setEditing((prev) => !prev)}
              onAddWidget={openAdd}
            />

            {page.widgets.length === 0 ? (
              <div className="rounded-xl border border-border border-dashed bg-secondary/30 py-12">
                <EmptyState
                  icon={<Plus size={40} className="text-primary opacity-60" />}
                  title={`${page.name} is empty`}
                  description="A page is just a container. Create your first widget — pick a visualization and scope it with the query builder."
                  action={
                    <button
                      type="button"
                      onClick={openAdd}
                      className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 font-medium text-sm text-white"
                    >
                      <Plus size={14} />
                      New widget
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="grid auto-rows-min grid-cols-12 gap-3">
                {page.widgets.map((widget) => (
                  <WidgetCard
                    key={widget.id}
                    widget={widget}
                    editing={editing}
                    onEdit={() => openEdit(widget)}
                    onRemove={() => setWidgetToDelete(widget)}
                  />
                ))}
                {editing && <AddWidgetTile onClick={openAdd} />}
              </div>
            )}

            <WidgetEditorModal
              open={editorOpen}
              onOpenChange={setEditorOpen}
              pageId={pageId}
              widgetCount={page.widgets.length}
              editingWidget={editingWidget}
            />

            <Modal
              open={!!widgetToDelete}
              onClose={() => setWidgetToDelete(null)}
              title="Remove widget"
              width={420}
              footer={
                <>
                  <button
                    type="button"
                    onClick={() => setWidgetToDelete(null)}
                    className="rounded border border-border bg-card px-3 py-1.5 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={removeWidget.isPending}
                    onClick={() =>
                      widgetToDelete &&
                      removeWidget.mutate(widgetToDelete.id, {
                        onSuccess: () => setWidgetToDelete(null),
                      })
                    }
                    className="rounded bg-error px-3 py-1.5 font-medium text-sm text-white hover:bg-error disabled:opacity-60"
                  >
                    {removeWidget.isPending ? "Removing…" : "Remove"}
                  </button>
                </>
              }
            >
              <p className="text-foreground-secondary text-sm">
                Remove{" "}
                <span className="font-medium text-foreground">
                  {widgetToDelete?.spec.title ?? "this widget"}
                </span>{" "}
                from this page? This cannot be undone.
              </p>
              {removeWidget.error && (
                <p className="mt-2 text-error text-xs">{removeWidget.error.message}</p>
              )}
            </Modal>
          </div>
        )}
      </div>
    </div>
  );
}

interface DetailHeaderProps {
  readonly page: DashboardPageDetail;
  readonly editing: boolean;
  readonly onToggleEditing: () => void;
  readonly onAddWidget: () => void;
}

function DetailHeader({ page, editing, onToggleEditing, onAddWidget }: DetailHeaderProps) {
  const updatePage = useUpdateDashboardPage(page.id);
  const [name, setName] = useState(page.name);
  const [description, setDescription] = useState(page.description ?? "");

  const Icon = pageIcon(page.icon);
  const widgetCount = page.widgets.length;

  const commit = (overrides: Partial<CreateDashboardPagePayload>) =>
    updatePage.mutate(pagePayload(page, overrides));

  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => commit({ isFavorite: !page.isFavorite })}
        title={page.isFavorite ? "Unfavorite" : "Favorite"}
        className="mt-1.5"
      >
        <Star
          size={18}
          className={page.isFavorite ? "fill-warning text-warning" : "text-foreground-muted"}
        />
      </button>
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-subtle-12)] text-primary">
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== page.name && commit({ name: name.trim() })}
            className="w-full rounded border border-border bg-background px-2 py-1 font-semibold text-[1.5rem] text-foreground tracking-[-0.01em] outline-none focus:border-primary"
          />
        ) : (
          <h1 className="m-0 truncate font-semibold text-[1.5rem] text-foreground tracking-[-0.01em]">
            {page.name}
          </h1>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {page.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-foreground-secondary"
            >
              #{tag}
            </span>
          ))}
        </div>
        {editing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => description !== (page.description ?? "") && commit({ description })}
            placeholder="Add a description…"
            rows={2}
            className="mt-1.5 w-full resize-none rounded border border-border bg-background px-2 py-1 text-foreground-secondary text-sm outline-none focus:border-primary"
          />
        ) : (
          page.description && (
            <p className="mt-1.5 text-foreground-secondary text-sm">{page.description}</p>
          )
        )}
        <div className="mt-1.5 text-foreground-muted text-xs">
          {page.owner ? `${page.owner.name} · ` : ""}
          {widgetCount} widget{widgetCount === 1 ? "" : "s"}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleEditing}
          className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-foreground text-sm hover:bg-secondary"
        >
          {editing ? <Check size={14} /> : <Pencil size={14} />}
          {editing ? "Done" : "Edit page"}
        </button>
        <button
          type="button"
          onClick={onAddWidget}
          className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 font-medium text-sm text-white hover:bg-primary"
        >
          <Plus size={14} />
          New widget
        </button>
      </div>
    </div>
  );
}

function AddWidgetTile({ onClick }: { readonly onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ gridColumn: "span 4", height: 88 }}
      className="flex items-center justify-center gap-1.5 rounded-lg border border-primary/40 border-dashed bg-[var(--color-primary-subtle-08)] text-primary text-sm hover:bg-[var(--color-primary-subtle-12)]"
    >
      <Plus size={16} />
      Add widget
    </button>
  );
}
