import { Copy } from "lucide-react";
import { memo, useMemo } from "react";

import type { LogRecord } from "../../types/log";
import { tryParseJson } from "../../utils/jsonDetect";
import { JsonTreeView } from "./JsonTreeView";

interface Props {
  readonly row: LogRecord;
}

/** Inline expanded row content — shows full body text and JSON tree (if parseable). */
function ExpandedLogRowComponent({ row }: Props) {
  const parsed = useMemo(() => tryParseJson(row.body), [row.body]);

  const onCopyBody = () => {
    void navigator.clipboard.writeText(row.body);
  };

  return (
    <div className="animate-[expandRow_200ms_ease-out] overflow-hidden border-border border-t bg-surface-inset">
      <div className="px-6 py-3">
        <div className="group/body relative mb-3">
          <div className="flex items-center justify-between pb-1">
            <span className="font-semibold text-[10px] text-foreground-muted uppercase tracking-wider">
              Full Message
            </span>
            <button
              type="button"
              onClick={onCopyBody}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-foreground-muted opacity-0 transition-opacity hover:text-foreground group-hover/body:opacity-100"
            >
              <Copy size={10} /> Copy
            </button>
          </div>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-background p-3 font-mono text-[12px] text-foreground leading-relaxed">
            {row.body || "—"}
          </pre>
        </div>

        {parsed ? (
          <div>
            <span className="mb-1.5 block font-semibold text-[10px] text-foreground-muted uppercase tracking-wider">
              Parsed JSON
            </span>
            <div className="rounded-md border border-border bg-background p-3">
              <JsonTreeView data={parsed} />
            </div>
          </div>
        ) : null}

        {row.traceId || row.spanId ? (
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            {row.traceId ? (
              <span className="font-mono text-[11px]">
                <span className="text-foreground-muted">traceId:</span>{" "}
                <span className="text-primary">{row.traceId}</span>
              </span>
            ) : null}
            {row.spanId ? (
              <span className="font-mono text-[11px]">
                <span className="text-foreground-muted">spanId:</span>{" "}
                <span className="text-primary">{row.spanId}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const ExpandedLogRow = memo(ExpandedLogRowComponent);
