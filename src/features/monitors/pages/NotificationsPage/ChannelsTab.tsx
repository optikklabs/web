import { Send } from "lucide-react";
import { useState } from "react";

import DataTable from "@shared/components/ui/data-display/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

import { type Channel, testChannel } from "../../api/notificationsApi";
import { useChannels } from "../../hooks/useChannels";
import { useChannelMutations } from "../../hooks/useNotificationMutations";

interface ChannelForm {
  id: number | null;
  name: string;
  webhookUrl: string;
}

function emptyForm(): ChannelForm {
  return { id: null, name: "", webhookUrl: "" };
}

function formFromChannel(ch: Channel): ChannelForm {
  return {
    id: ch.id,
    name: ch.name,
    webhookUrl: "",
  };
}

import { errorMessage } from "@shared/api/utils/errorNormalization";

export default function ChannelsTab() {
  const channelsQ = useChannels();
  const { create, update, remove } = useChannelMutations();
  const [form, setForm] = useState<ChannelForm>(emptyForm());
  const [status, setStatus] = useState<string | null>(null);

  const editing = form.id !== null;

  const handleSubmit = async () => {
    setStatus(null);
    const webhookUrl = form.webhookUrl.trim();
    const payload = {
      type: "slack" as const,
      name: form.name,
      config: webhookUrl ? { webhookUrl } : {},
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

  const handleTest = async (id: number) => {
    setStatus(null);
    try {
      const res = await testChannel(id);
      setStatus(res.ok ? "Test delivery sent." : `Test failed: ${res.errorText}`);
      channelsQ.refetch();
    } catch (err) {
      setStatus(errorMessage(err));
    }
  };

  const saving = create.isPending || update.isPending;

  // Edit/Test/Delete cells close over the form state, so columns live in render.
  const columns: ColumnDef<Channel>[] = [
    {
      header: "Channel",
      accessorKey: "name",
      cell: ({ row: { original: ch } }) => (
        <div className="flex items-center gap-2">
          <Send size={13} className="text-foreground-muted" />
          <span className="font-mono text-xs">{ch.name}</span>
        </div>
      ),
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: ({ row: { original: ch } }) => (
        <span className="font-bold font-mono text-[10px] uppercase">{ch.type}</span>
      ),
    },
    {
      header: "Used by",
      accessorKey: "usedByCount",
      meta: { align: "right" },
      cell: ({ row: { original: ch } }) => <span className="font-mono">{ch.usedByCount}</span>,
    },
    {
      header: "Last delivery",
      accessorKey: "lastDeliveryAt",
      cell: ({ row: { original: ch } }) => (
        <span className="font-mono text-[11px] text-foreground-muted">
          {ch.lastDeliveryAt ? new Date(ch.lastDeliveryAt).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      meta: { align: "right" },
      cell: ({ row: { original: ch } }) => (
        <>
          <button
            type="button"
            onClick={() => setForm(formFromChannel(ch))}
            className="mr-1 rounded border border-border px-2 py-0.5 text-[11px] hover:bg-secondary"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleTest(ch.id)}
            className="mr-1 rounded border border-border px-2 py-0.5 text-[11px] hover:bg-secondary"
          >
            Test
          </button>
          <button
            type="button"
            onClick={() => handleDelete(ch.id)}
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
        <div className="font-medium text-sm">{editing ? "Edit channel" : "Create channel"}</div>
        <div className="mt-3 grid grid-cols-[120px_1fr_1fr_auto] items-center gap-2">
          <div className="rounded border border-border bg-muted px-2 py-1.5 text-xs">Slack</div>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Channel name (e.g. #oncall-payments)"
            className="rounded border border-border bg-card px-2 py-1.5 text-xs"
          />
          <input
            value={form.webhookUrl}
            onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))}
            placeholder={editing ? "Leave blank to keep existing webhook" : "Slack webhook URL"}
            className="rounded border border-border bg-card px-2 py-1.5 font-mono text-xs"
          />
          <div className="flex items-center gap-1.5">
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

      <DataTable
        data={{
          columns,
          rows: channelsQ.data ?? [],
          loading: channelsQ.isPending && !channelsQ.data,
        }}
        config={{ emptyText: "No channels yet." }}
      />
    </div>
  );
}
