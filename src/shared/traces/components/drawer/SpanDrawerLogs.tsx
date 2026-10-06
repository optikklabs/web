import type { TraceLog } from "@shared/api/traces/schemas";
import { DrawerSection } from "@shared/components/ui/overlay/detail-drawer/DrawerSection";
import { LogsTable } from "@shared/logs/components/table/LogsTable";
import { traceLogToLogRecord } from "@shared/logs/utils/traceLogAdapter";
import { ScrollText } from "lucide-react";
import { memo, useMemo } from "react";

interface Props {
  readonly spanLogs: readonly TraceLog[];
  readonly onOpenInLogs?: () => void;
}

function SpanDrawerLogsComponent({ spanLogs, onOpenInLogs }: Props) {
  const rows = useMemo(() => spanLogs.map(traceLogToLogRecord), [spanLogs]);

  if (spanLogs.length === 0) {
    return (
      <DrawerSection title="Span Logs">
        <div className="rounded-md border border-border bg-secondary p-4 text-center text-[12.5px] text-foreground-muted">
          No logs explicitly emitted for this span ID.
        </div>
      </DrawerSection>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-foreground-caption">
          {spanLogs.length} log record{spanLogs.length === 1 ? "" : "s"} tied to this span ID
        </span>
        {onOpenInLogs ? (
          <button
            type="button"
            onClick={onOpenInLogs}
            className="inline-flex cursor-pointer items-center gap-1 font-mono text-[11px] text-primary hover:underline"
          >
            <ScrollText size={11} /> Open in Logs Explorer →
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <LogsTable rows={rows} emptyTitle="No logs for this span" />
      </div>
    </div>
  );
}

export const SpanDrawerLogs = memo(SpanDrawerLogsComponent);
