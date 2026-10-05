import { Copy, ScrollText } from "lucide-react";
import { memo, useState } from "react";

import { TraceHeaderBreadcrumbs } from "./TraceHeaderBreadcrumbs";

interface Props {
  readonly traceId: string;
  readonly startMs?: number;
  readonly rootService?: string;
  readonly rootOperation?: string;
  readonly httpMethod?: string;
  readonly httpStatus?: number;
  readonly onOpenInLogs: () => void;
  readonly onBack: () => void;
}

const btnSmGhost =
  "px-2.5 py-[5px] text-[11.5px] rounded-[5px] bg-transparent text-foreground-muted border border-transparent cursor-pointer hover:bg-muted hover:text-foreground";
const btnSmPrimary =
  "px-2.5 py-[5px] text-[11.5px] rounded-[5px] bg-primary text-primary-foreground border border-transparent cursor-pointer font-medium hover:bg-primary-hover";

function TraceHeaderComponent({
  traceId,
  rootService,
  rootOperation,
  httpMethod,
  httpStatus,
  onOpenInLogs,
  onBack,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyTraceId = () => {
    void navigator.clipboard.writeText(traceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="flex justify-between gap-6 border-border border-b bg-background px-5 pt-[14px] pb-3">
      <div className="min-w-0 flex-1">
        <TraceHeaderBreadcrumbs
          rootService={rootService}
          rootOperation={rootOperation}
          httpMethod={httpMethod}
          httpStatus={httpStatus}
          onBack={onBack}
        />
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <h1 className="font-semibold text-[17px] text-foreground tracking-[-0.015em]">
            {rootOperation || rootService || traceId}
          </h1>
          <span className="font-mono text-[12px] text-foreground-muted">{traceId}</span>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-mono text-[11px] text-foreground-caption hover:text-foreground"
            onClick={copyTraceId}
          >
            <Copy size={11} /> {copied ? "Copied" : "Copy ID"}
          </button>
        </div>
      </div>

      <div className="flex flex-none items-center gap-2">
        <button type="button" className={btnSmGhost} onClick={onOpenInLogs}>
          <ScrollText size={13} className="mr-1 inline" /> Logs for trace
        </button>
        <button type="button" className={btnSmPrimary} onClick={copyTraceId}>
          {copied ? "Copied ID" : "Share trace"}
        </button>
      </div>
    </header>
  );
}

export const TraceHeader = memo(TraceHeaderComponent);
