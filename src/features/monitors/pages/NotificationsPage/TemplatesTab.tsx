import { useState } from "react";

import type { Template } from "../../api/notificationsApi";
import { useTemplateMutations } from "../../hooks/useNotificationMutations";
import { useTemplates } from "../../hooks/useNotifications";

interface TemplateForm {
  id: number | null;
  name: string;
  description: string;
  body: string;
}

function emptyForm(): TemplateForm {
  return { id: null, name: "", description: "", body: "" };
}

function formFromTemplate(t: Template): TemplateForm {
  return { id: t.id, name: t.name, description: t.description ?? "", body: t.body };
}

import { errorMessage } from "@shared/api/utils/errorNormalization";

export default function TemplatesTab() {
  const q = useTemplates();
  const { create, update, remove } = useTemplateMutations();
  const templates = q.data ?? [];
  const [form, setForm] = useState<TemplateForm>(emptyForm());
  const [status, setStatus] = useState<string | null>(null);

  const editing = form.id !== null;
  const saving = create.isPending || update.isPending;

  const handleSubmit = async () => {
    setStatus(null);
    const payload = {
      name: form.name,
      description: form.description.trim() === "" ? undefined : form.description,
      body: form.body,
    };
    try {
      if (form.id !== null) {
        await update.mutateAsync({ id: form.id, payload });
      } else {
        await create.mutateAsync(payload);
      }
      setForm(emptyForm());
    } catch (err) {
      setStatus(errorMessage(err));
    }
  };

  const handleDelete = async (id: number) => {
    setStatus(null);
    try {
      await remove.mutateAsync(id);
      if (form.id === id) setForm(emptyForm());
    } catch (err) {
      setStatus(errorMessage(err));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="font-medium text-sm">{editing ? "Edit template" : "Create template"}</div>
        <div className="mt-3 grid gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Template name (e.g. Payments incident)"
            className="rounded border border-border bg-card px-2 py-1.5 text-xs"
          />
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            className="rounded border border-border bg-card px-2 py-1.5 text-xs"
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={5}
            placeholder="Message body · supports {{value}} {{threshold}} {{service.name}} placeholders"
            className="rounded border border-border bg-card px-2 py-2 font-mono text-xs"
          />
          <div className="flex items-center justify-end gap-1.5">
            {editing && (
              <button
                type="button"
                onClick={() => setForm(emptyForm())}
                className="rounded border border-border px-3 py-1.5 text-xs hover:bg-secondary"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="rounded bg-primary px-3 py-1.5 font-medium text-white text-xs hover:bg-primary disabled:opacity-60"
            >
              {editing ? "Save" : "Create"}
            </button>
          </div>
        </div>
        {status && <div className="mt-2 text-warning text-xs">{status}</div>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {q.isPending ? (
          <div className="col-span-2 rounded-lg border border-border bg-card p-6 text-center text-foreground-muted text-xs">
            Loading templates…
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-2 rounded-lg border border-border border-dashed p-8 text-center text-foreground-muted text-sm">
            No templates yet. Create one above to customize notification message bodies.
          </div>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-baseline justify-between">
                <div className="font-medium text-sm">{t.name}</div>
                <span className="font-mono text-[10px] text-foreground-muted">
                  {t.usedCount} in use
                </span>
              </div>
              {t.description && (
                <div className="mt-0.5 text-[11px] text-foreground-muted">{t.description}</div>
              )}
              <div className="mt-3 rounded bg-secondary p-3">
                <div className="whitespace-pre-line font-mono text-[11px] text-foreground-secondary">
                  {t.body}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setForm(formFromTemplate(t))}
                  className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-secondary"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="rounded border border-border px-2 py-0.5 text-[11px] text-error hover:bg-secondary"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
