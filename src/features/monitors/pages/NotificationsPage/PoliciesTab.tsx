import { useState } from "react";

import DataTable from "@shared/components/ui/data-display/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

import type { Policy } from "../../api/notificationsApi";
import { usePolicyMutations } from "../../hooks/useNotificationMutations";
import { usePolicies } from "../../hooks/useNotifications";

interface PolicyForm {
  id: number | null;
  name: string;
  matchDsl: string;
  actionsJson: string;
  enabled: boolean;
}

function emptyForm(): PolicyForm {
  return { id: null, name: "", matchDsl: "", actionsJson: "[]", enabled: true };
}

function formFromPolicy(p: Policy): PolicyForm {
  return {
    id: p.id,
    name: p.name,
    matchDsl: p.matchDsl,
    actionsJson: JSON.stringify(p.actions, null, 2),
    enabled: p.enabled,
  };
}

import { getErrorMessage } from "@shared/utils/errorUtils";

function parseActions(json: string): unknown[] {
  const trimmed = json.trim();
  if (trimmed === "") return [];
  const parsed = JSON.parse(trimmed);
  if (!Array.isArray(parsed)) throw new Error("Actions must be a JSON array");
  return parsed;
}

export default function PoliciesTab() {
  const q = usePolicies();
  const { create, update, remove } = usePolicyMutations();
  const policies = q.data ?? [];
  const [form, setForm] = useState<PolicyForm>(emptyForm());
  const [status, setStatus] = useState<string | null>(null);

  const editing = form.id !== null;
  const saving = create.isPending || update.isPending;

  const handleSubmit = async () => {
    setStatus(null);
    let actions: unknown[];
    try {
      actions = parseActions(form.actionsJson);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Invalid actions JSON");
      return;
    }
    const payload = {
      name: form.name,
      matchDsl: form.matchDsl,
      actions,
      enabled: form.enabled,
    };
    try {
      if (form.id !== null) {
        await update.mutateAsync({ id: form.id, payload });
      } else {
        await create.mutateAsync(payload);
      }
      setForm(emptyForm());
    } catch (err) {
      setStatus(getErrorMessage(err, "Failed to save policy"));
    }
  };

  const handleDelete = async (id: number) => {
    setStatus(null);
    try {
      await remove.mutateAsync(id);
      if (form.id === id) setForm(emptyForm());
    } catch (err) {
      setStatus(getErrorMessage(err, "Failed to delete policy"));
    }
  };

  // Edit/Delete cells close over the form state, so columns live in render.
  const columns: ColumnDef<Policy>[] = [
    {
      header: "Policy",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-foreground-muted">
            {String(row.index + 1).padStart(2, "0")}
          </span>
          <span className="font-medium text-xs">{row.original.name}</span>
        </div>
      ),
    },
    {
      header: "Match",
      accessorKey: "matchDsl",
      cell: ({ row: { original: p } }) => (
        <span className="font-mono text-[11px] text-foreground-secondary">{p.matchDsl}</span>
      ),
    },
    {
      header: "Hits 30d",
      accessorKey: "hits30d",
      meta: { align: "right" },
      cell: ({ row: { original: p } }) => <span className="font-mono">{p.hits30d}</span>,
    },
    {
      header: "Enabled",
      accessorKey: "enabled",
      cell: ({ row: { original: p } }) => (
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] ${
            p.enabled ? "bg-success-subtle text-success" : "bg-muted text-foreground-secondary"
          }`}
        >
          {p.enabled ? "on" : "off"}
        </span>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      meta: { align: "right" },
      cell: ({ row: { original: p } }) => (
        <>
          <button
            type="button"
            onClick={() => setForm(formFromPolicy(p))}
            className="mr-1 rounded border border-border px-2 py-0.5 text-[11px] hover:bg-secondary"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(p.id)}
            className="rounded border border-border px-2 py-0.5 text-[11px] text-error hover:bg-secondary"
          >
            Delete
          </button>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="font-medium text-sm">{editing ? "Edit policy" : "Create policy"}</div>
        <div className="mt-3 grid gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Policy name (e.g. Page on-call for P1 payments)"
            className="rounded border border-border bg-card px-2 py-1.5 text-xs"
          />
          <input
            value={form.matchDsl}
            onChange={(e) => setForm((f) => ({ ...f, matchDsl: e.target.value }))}
            placeholder="Match DSL (e.g. priority:P1 AND tenant:payments)"
            className="rounded border border-border bg-card px-2 py-1.5 font-mono text-xs"
          />
          <textarea
            value={form.actionsJson}
            onChange={(e) => setForm((f) => ({ ...f, actionsJson: e.target.value }))}
            rows={3}
            placeholder='Actions (JSON array, e.g. [{"channelId": 1}])'
            className="rounded border border-border bg-card px-2 py-1.5 font-mono text-xs"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-foreground-secondary text-xs">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              />
              Enabled
            </label>
            <div className="ml-auto flex items-center gap-1.5">
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
        </div>
        {status && <div className="mt-2 text-warning text-xs">{status}</div>}
      </div>

      <div>
        <div className="px-1 pb-2">
          <div className="font-medium text-sm">Routing policies</div>
          <div className="text-[11px] text-foreground-muted">
            Rules evaluated top-down · first match wins.
          </div>
        </div>
        <DataTable
          data={{ columns, rows: policies, loading: q.isPending && !q.data }}
          config={{ emptyText: "No policies yet." }}
        />
      </div>
    </div>
  );
}
