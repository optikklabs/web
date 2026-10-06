import { memo, useEffect, useState } from "react";

import { formatErrorForDisplay } from "@shared/api/utils/errorNormalization";
import { DrawerJson } from "@shared/components/ui/overlay/detail-drawer/DrawerJson";
import { DrawerShell } from "@shared/components/ui/overlay/detail-drawer/DrawerShell";
import { DrawerTabs } from "@shared/components/ui/overlay/detail-drawer/DrawerTabs";
import { useStandardQuery } from "@shared/hooks/useStandardQuery";

import { getLogById } from "../../api/logByIdApi";
import { getTraceId } from "../../utils/traceCorrelation";
import { LogDetailEventTab } from "./LogDetailEventTab";
import { LogDetailFooter } from "./LogDetailFooter";
import { LogDetailHeader } from "./LogDetailHeader";
import { LogDetailRelatedTab } from "./LogDetailRelatedTab";

interface Props {
  readonly logId: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onPrev?: () => void;
  readonly onNext?: () => void;
}

type LogTab = "event" | "json" | "related";

function LogDetailDrawerInner({ logId, startTime, endTime, open, onClose, onPrev, onNext }: Props) {
  const [tab, setTab] = useState<LogTab>("event");
  useEffect(() => {
    if (open) setTab("event");
  }, [open]);

  const q = useStandardQuery({
    queryKey: ["logs", "detail", logId, startTime, endTime],
    queryFn: () => getLogById(logId, startTime, endTime),
    enabled: Boolean(logId) && open,
    staleTime: 30_000,
  });

  const log = q.data?.log;
  const traceId = log ? getTraceId(log) : null;

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      title="Log details"
      width="min(560px, calc(100vw - 24px))"
      footer={<LogDetailFooter traceId={traceId} onPrev={onPrev} onNext={onNext} />}
    >
      <LogDetailHeader log={log} onClose={onClose} />

      <DrawerTabs
        tabs={[
          { id: "event", label: "Event" },
          { id: "json", label: "JSON" },
          { id: "related", label: "Related" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as LogTab)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-4">
        {q.isPending ? (
          <div className="py-4 text-[13px] text-[var(--fg-3)]">Loading log…</div>
        ) : q.isError ? (
          <div className="flex flex-col gap-2">
            <p className="font-medium text-[13px] text-[var(--err-fg)]">Could not load log</p>
            <pre className="text-[11px] text-[var(--fg-3)]">{formatErrorForDisplay(q.error)}</pre>
          </div>
        ) : !log ? (
          <div className="py-4 text-[13px] text-[var(--fg-3)]">No data</div>
        ) : (
          <>
            {tab === "event" && <LogDetailEventTab log={log} traceId={traceId} />}

            {tab === "json" && <DrawerJson data={log} />}

            {tab === "related" && (
              <LogDetailRelatedTab traceId={traceId} log={log} open={open} isActive />
            )}
          </>
        )}
      </div>
    </DrawerShell>
  );
}

function LogDetailDrawerComponent(props: Props) {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    if (props.open) setHasMounted(true);
  }, [props.open]);

  if (!hasMounted) return null;

  return <LogDetailDrawerInner {...props} />;
}

export const LogDetailDrawer = memo(LogDetailDrawerComponent);
