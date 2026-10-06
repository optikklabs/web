import { useNavigate } from "@tanstack/react-router";

import type { CreateMonitorPayload } from "../../api/monitorsApi";
import type { Channel } from "../../api/notificationsApi";
import { RENOTIFY_WINDOWS, formatWindowLabel } from "../../constants";
import { useChannels } from "../../hooks/useChannels";

import StepShell from "./StepShell";
import FieldRow from "./queryForms/FieldRow";

interface Props {
  readonly draft: CreateMonitorPayload;
  readonly setDraft: (fn: (prev: CreateMonitorPayload) => CreateMonitorPayload) => void;
}

function isSelected(ids: number[], id: number): boolean {
  return ids.includes(id);
}

function toggle(ids: number[], id: number): number[] {
  return isSelected(ids, id) ? ids.filter((x) => x !== id) : [...ids, id];
}

function ChannelChip({
  channel,
  selected,
  onToggle,
}: {
  channel: Channel;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded border px-2.5 py-1 text-xs ${
        selected
          ? "border-primary bg-[var(--color-primary-subtle-12)] text-foreground"
          : "border-border bg-card text-foreground-secondary"
      }`}
    >
      <span className="font-mono">@{channel.name}</span>
    </button>
  );
}

export default function WizardNotifyStep({ draft, setDraft }: Props) {
  const navigate = useNavigate();
  const channelsQ = useChannels();
  const ids = draft.notify.channelIds;

  return (
    <StepShell n={4} title="Configure notifications" sub="Who should be alerted, and how?">
      <FieldRow label="Send to">
        <div className="flex flex-wrap items-center gap-1.5">
          {channelsQ.isPending ? (
            <span className="text-foreground-muted text-xs">Loading channels…</span>
          ) : (channelsQ.data ?? []).length === 0 ? (
            <span className="text-foreground-muted text-xs">
              No channels yet —{" "}
              <button
                type="button"
                onClick={() => navigate({ to: "/monitors/notifications" })}
                className="text-primary underline"
              >
                add one
              </button>
              .
            </span>
          ) : (
            (channelsQ.data ?? []).map((ch) => (
              <ChannelChip
                key={ch.id}
                channel={ch}
                selected={isSelected(ids, ch.id)}
                onToggle={() =>
                  setDraft((prev) => ({
                    ...prev,
                    notify: { channelIds: toggle(prev.notify.channelIds, ch.id) },
                  }))
                }
              />
            ))
          )}
          <button
            type="button"
            onClick={() => navigate({ to: "/monitors/notifications" })}
            className="ml-2 text-[11px] text-primary underline"
          >
            manage channels →
          </button>
        </div>
      </FieldRow>
      <FieldRow label="Message template">
        <textarea
          value={draft.messageBody ?? ""}
          onChange={(e) => setDraft((prev) => ({ ...prev, messageBody: e.target.value }))}
          rows={4}
          placeholder="Error rate {{value}}% exceeds threshold ({{threshold}}%) for {{service.name}} {{#is_alert}}@oncall{{/is_alert}}"
          className="w-full rounded border border-border bg-card px-2.5 py-2 font-mono text-xs"
        />
      </FieldRow>
      <FieldRow label="Renotify if unresolved">
        <div className="flex items-center gap-1.5">
          {RENOTIFY_WINDOWS.map((sec) => {
            const active = (draft.renotifyEverySec ?? 0) === sec;
            const label = formatWindowLabel(sec);
            return (
              <button
                key={sec}
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    renotifyEverySec: sec === 0 ? undefined : sec,
                  }))
                }
                className={`rounded px-2 py-0.5 text-xs ${
                  active ? "bg-primary text-white" : "bg-secondary text-foreground-secondary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </FieldRow>
    </StepShell>
  );
}
