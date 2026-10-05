import type { TraceRecord } from "@shared/api/traces/schemas";
import { Copy, Download } from "lucide-react";
import { memo } from "react";

interface Props {
  readonly traceId: string;
  readonly spans: readonly TraceRecord[];
}

const btnSmGhost =
  "px-2.5 py-[5px] text-[11.5px] rounded-[5px] bg-transparent text-foreground-muted border border-transparent cursor-pointer hover:bg-muted hover:text-foreground";

function RawJsonTabComponent({ traceId, spans }: Props) {
  const json = JSON.stringify({ traceId, spans }, null, 2);

  const onDownload = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trace-${traceId.slice(0, 16)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onCopy = () => {
    void navigator.clipboard?.writeText(json);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="py-2 text-[12px] text-foreground-caption">
          OpenTelemetry-style trace document · {spans.length} span{spans.length === 1 ? "" : "s"}
        </span>
        <div className="flex gap-1.5">
          <button type="button" className={btnSmGhost} onClick={onCopy}>
            <Copy size={12} /> Copy
          </button>
          <button type="button" className={btnSmGhost} onClick={onDownload}>
            <Download size={12} /> Download .json
          </button>
        </div>
      </div>
      <pre className="m-0 min-h-0 flex-1 overflow-auto whitespace-pre rounded-md border border-border bg-secondary p-3 font-mono text-[11.5px] text-foreground-secondary">
        {json}
      </pre>
    </div>
  );
}

export const RawJsonTab = memo(RawJsonTabComponent);
