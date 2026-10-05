import { useNavigate } from "@tanstack/react-router";
import { ExternalLink, GitFork } from "lucide-react";
import { memo } from "react";

import { DrawerAttrTable } from "@shared/components/ui/overlay/detail-drawer/DrawerAttrTable";
import { DrawerSection } from "@shared/components/ui/overlay/detail-drawer/DrawerSection";
import { buildTraceDetailHref } from "@shared/observability/deepLinks";
import type { LogRecord } from "../../types/log";
import { buildAttrGroups } from "../../utils/logTransformers";
import { severityStyle } from "../../utils/severity";

interface Props {
  readonly log: LogRecord;
  readonly traceId: string | null;
}

function LogDetailEventTabComponent({ log, traceId }: Props) {
  const navigate = useNavigate();

  const sev = severityStyle(log.severityBucket);
  const attrGroups = buildAttrGroups(log, sev.label, sev.color);

  return (
    <>
      <DrawerSection title="Message">
        <div className="whitespace-pre-wrap break-words rounded-lg border border-[var(--line-2)] bg-[var(--bg-inset)] p-[12px_14px] font-mono text-[13px] text-[var(--fg-0)] leading-[1.55]">
          {log.body || "—"}
        </div>
      </DrawerSection>

      {traceId && (
        <DrawerSection title="Correlated trace">
          <button
            type="button"
            onClick={() => {
              navigate({ to: buildTraceDetailHref(traceId) as never });
            }}
            className="flex w-full items-center gap-3 rounded-lg border border-[var(--accent-ln)] bg-[var(--accent-bg)] p-[11px_13px] text-left"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--bg-card)] text-[var(--accent-2)]">
              <GitFork size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono font-semibold text-[13px] text-[var(--accent-2)]">
                {traceId}
              </span>
              <span className="mt-0.5 block text-[12px] text-[var(--fg-3)]">
                Open the distributed trace for this log
              </span>
            </span>
            <ExternalLink size={13} className="text-[var(--fg-3)]" />
          </button>
        </DrawerSection>
      )}

      <DrawerSection title="Attributes">
        <DrawerAttrTable groups={attrGroups} />
      </DrawerSection>
    </>
  );
}

export const LogDetailEventTab = memo(LogDetailEventTabComponent);
