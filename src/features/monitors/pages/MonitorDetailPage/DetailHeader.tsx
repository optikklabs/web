import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, MoreHorizontal, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { memo, useState } from "react";

import { Modal } from "@shared/components/primitives/ui/dialog";
import { DropdownMenu, DropdownMenuItem } from "@shared/components/primitives/ui/dropdown-menu";

import type { Monitor } from "../../api/monitorsApi";
import MonitorStatusBadge from "../../components/MonitorStatusBadge";
import PriorityChip from "../../components/PriorityChip";

interface Props {
  readonly monitor: Monitor;
  readonly onAck: () => void;
  /** Called with the current mute state; mutes for an hour or unmutes. */
  readonly onMute: (muted: boolean) => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly deleting: boolean;
  readonly deleteError: string | null;
}

function DetailHeader({ monitor, onAck, onMute, onEdit, onDelete, deleting, deleteError }: Props) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const scope = (monitor.scope.tags ?? []).map((t) => `${t.key}:${t.value}`).join(" ");
  const muted = monitor.mutedUntil !== undefined && Date.parse(monitor.mutedUntil) > Date.now();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => navigate({ to: "/monitors" })}
          className="flex items-center gap-1 text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft size={12} />
          Monitors
        </button>
        <span className="text-foreground-muted">/</span>
        <span className="font-medium font-mono text-foreground">m-{monitor.id}</span>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="font-semibold text-2xl text-foreground">{monitor.name}</h1>
            <MonitorStatusBadge status={monitor.status} />
            <PriorityChip priority={monitor.priority} />
            <span className="font-bold font-mono text-[10px] text-foreground-muted uppercase">
              {monitor.type}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-foreground-muted">
            {scope && (
              <span>
                Scope <span className="font-mono text-foreground-secondary">{scope}</span>
              </span>
            )}
            <span>
              Eval every{" "}
              <span className="font-mono text-foreground-secondary">{monitor.evalEverySec}s</span>
            </span>
            {monitor.lastEvaluatedAt && (
              <span>
                Last eval{" "}
                <span className="font-mono text-foreground-secondary">
                  {new Date(monitor.lastEvaluatedAt).toLocaleString()}
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onAck}
            className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary"
          >
            <Check size={13} />
            Acknowledge
          </button>
          <button
            type="button"
            onClick={() => onMute(muted)}
            className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary"
          >
            {muted ? <Play size={13} /> : <Pause size={13} />}
            {muted ? "Unmute" : "Mute · 1h"}
          </button>
          <DropdownMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            trigger={
              <button
                type="button"
                className="rounded border border-border bg-card p-1.5 hover:bg-secondary"
              >
                <MoreHorizontal size={14} />
              </button>
            }
          >
            <DropdownMenuItem
              onSelect={() => {
                setMenuOpen(false);
                onEdit();
              }}
            >
              <Pencil size={13} className="mr-2" />
              Edit monitor
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-error"
              onSelect={() => {
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
            >
              <Trash2 size={13} className="mr-2" />
              Delete monitor
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete monitor"
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
              disabled={deleting}
              onClick={onDelete}
              className="rounded bg-error px-3 py-1.5 font-medium text-sm text-white hover:bg-error disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-foreground-secondary text-sm">
          Delete <span className="font-medium text-foreground">{monitor.name}</span>? This stops all
          evaluation and notifications for this monitor and cannot be undone.
        </p>
        {deleteError && <p className="mt-2 text-error text-xs">{deleteError}</p>}
      </Modal>
    </div>
  );
}

export default memo(DetailHeader);
