import { svcHue } from "@shared/traces/utils/color";
import { formatDuration } from "@shared/utils/formatters";
import { AlertCircle, Copy, Zap } from "lucide-react";
import { memo, useState } from "react";

export interface SelectedSpan {
  readonly spanId?: string;
  readonly operationName?: string;
  readonly serviceName?: string;
  readonly status?: string;
  readonly spanKind?: string;
  readonly durationMs?: number;
  readonly httpMethod?: string;
  readonly responseStatusCode?: string;
}

interface Props {
  readonly span: SelectedSpan;
  readonly spanId: string;
  readonly isCritical: boolean;
  readonly traceStartMs?: number;
  readonly traceEndMs?: number;
  readonly onClose: () => void;
}

const pillBase = "inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px]";
const btnGhost =
  "inline-flex place-items-center h-6 w-6 p-0 rounded border-0 bg-transparent text-foreground-muted cursor-pointer hover:bg-muted hover:text-foreground";

function SpanDrawerHeaderComponent({ span, spanId, isCritical }: Props) {
  const [copied, setCopied] = useState(false);

  const copySpanId = () => {
    void navigator.clipboard.writeText(spanId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const service = span.serviceName || "—";
  const hue = svcHue(service);
  const swatchBg = `oklch(0.62 0.14 ${hue})`;
  const isError = (span.status ?? "").toUpperCase() === "ERROR";

  return (
    <div className="flex flex-col gap-2.5 border-border border-b bg-background p-[18px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className="inline-block h-2 w-2 flex-none rounded-full"
              style={{ background: swatchBg }}
            />
            <span className="text-[12px] text-foreground-muted">{service}</span>
            {span.spanKind && (
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground-caption uppercase">
                {span.spanKind}
              </span>
            )}
            {isCritical && (
              <span className="inline-flex items-center gap-1 rounded bg-degraded-subtle px-1.5 py-0.5 font-mono text-[10px] text-degraded">
                <Zap size={10} /> Critical Path
              </span>
            )}
          </div>
          <h2 className="break-words font-semibold text-[17px] text-foreground tracking-[-0.015em]">
            {span.operationName || "(no name)"}
          </h2>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-border/60 border-t pt-2.5 text-[12px]">
        <div className="flex flex-wrap items-center gap-2">
          {isError ? (
            <span className={`${pillBase} bg-error-subtle font-semibold text-error`}>
              <AlertCircle size={12} /> ERROR
            </span>
          ) : (
            <span className={`${pillBase} bg-success-subtle text-success`}>OK</span>
          )}

          <span className={`${pillBase} bg-secondary font-semibold text-foreground`}>
            {formatDuration(span.durationMs ?? 0)}
          </span>

          {span.httpMethod && (
            <span className={`${pillBase} bg-muted text-foreground-secondary`}>
              {span.httpMethod} {span.responseStatusCode ? `· ${span.responseStatusCode}` : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 font-mono text-[11px] text-foreground-muted">
          <span className="max-w-[120px] truncate" title={spanId}>
            {spanId}
          </span>
          <button
            type="button"
            className={btnGhost}
            onClick={copySpanId}
            title={copied ? "Copied span ID" : "Copy span ID"}
          >
            <Copy size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export const SpanDrawerHeader = memo(SpanDrawerHeaderComponent);
