import { useNavigate } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { useState } from "react";

import { ROUTES } from "@/shared/constants/routes";
import { DrawerShell } from "@shared/components/ui/overlay/detail-drawer/DrawerShell";

import { useCreateDashboardPage } from "@shared/dashboards/hooks/useDashboardMutations";

interface CreatePageDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function CreatePageDrawer({ open, onOpenChange }: CreatePageDrawerProps) {
  const navigate = useNavigate();
  const createPage = useCreateDashboardPage();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setTags("");
    setIsFavorite(false);
  };

  const canSubmit = name.trim().length > 0 && !createPage.isPending;

  const submit = () => {
    if (!canSubmit) return;
    createPage.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        tags: parseTags(tags),
        isFavorite: isFavorite,
      },
      {
        onSuccess: (page) => {
          reset();
          onOpenChange(false);
          void navigate({ to: ROUTES.dashboardDetail, params: { pageId: String(page.id) } });
        },
      }
    );
  };

  return (
    <DrawerShell
      open={open}
      onClose={() => onOpenChange(false)}
      title="New page"
      width="min(480px, 92vw)"
      footer={
        <>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded border border-border bg-card px-3 py-1.5 text-foreground text-sm hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="rounded bg-primary px-3 py-1.5 font-medium text-sm text-white hover:bg-primary disabled:opacity-50"
          >
            {createPage.isPending ? "Creating…" : "Create page"}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3 border-border border-b px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-subtle-12)] text-primary">
          <Plus size={16} />
        </span>
        <div className="flex-1">
          <div className="font-semibold text-foreground text-sm">New page</div>
          <div className="text-foreground-muted text-xs">
            Empty by default — add widgets after creating
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded p-1 text-foreground-muted hover:bg-secondary hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <label
          className="mb-2 block font-medium text-foreground-secondary text-xs"
          htmlFor="dp-name"
        >
          Page name
        </label>
        <input
          id="dp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Payments — Production health"
          className="w-full rounded border border-border bg-background px-3 py-2 text-foreground text-sm outline-none focus:border-primary"
        />

        <label
          className="mt-4 mb-2 block font-medium text-foreground-secondary text-xs"
          htmlFor="dp-desc"
        >
          Description (optional)
        </label>
        <input
          id="dp-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="One line — what this page is for, who looks at it"
          className="w-full rounded border border-border bg-background px-3 py-2 text-foreground text-sm outline-none focus:border-primary"
        />

        <label
          className="mt-4 mb-2 block font-medium text-foreground-secondary text-xs"
          htmlFor="dp-tags"
        >
          Tags (optional, comma-separated)
        </label>
        <input
          id="dp-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="sre, payments, on-call"
          className="w-full rounded border border-border bg-background px-3 py-2 text-foreground text-sm outline-none focus:border-primary"
        />

        <label className="mt-4 flex items-center gap-2 text-foreground-secondary text-sm">
          <input
            type="checkbox"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
            className="accent-[var(--color-primary)]"
          />
          Mark as favorite
        </label>

        {createPage.isError && (
          <div className="mt-4 rounded border border-error/40 bg-error-subtle px-3 py-2 text-error text-xs">
            {createPage.error.message}
          </div>
        )}
      </div>
    </DrawerShell>
  );
}
