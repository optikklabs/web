import type { TraceErrorGroup, TraceRecord } from "@shared/api/traces/schemas";
import { formatDuration } from "@shared/utils/formatters";
import { AlertCircle } from "lucide-react";
import { memo } from "react";
import { TraceErrorSummary } from "./TraceErrorSummary";

interface Props {
  readonly spans: readonly TraceRecord[];
  readonly onSelect: (span: { spanId: string }) => void;
  readonly errorGroups?: readonly TraceErrorGroup[];
}

function ErrorsTabComponent({ spans, onSelect, errorGroups }: Props) {
  const errs = spans.filter((s) => (s.status ?? "").toUpperCase() === "ERROR");
  const groups = errorGroups ?? [];

  if (errs.length === 0 && groups.length === 0) {
    return (
      <div className="grid place-items-center gap-1.5 px-5 py-20 text-center">
        <div className="font-semibold text-[18px] text-foreground">No errored spans</div>
        <div className="max-w-[480px] text-[13px] text-foreground-muted">
          Every span in this trace finished with a non-error status.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 overflow-auto p-4">
      {groups.length > 0 && <TraceErrorSummary groups={groups} onSpanClick={onSelect} />}
      {errs.length > 0 && (
        <div className="text-[12px] text-foreground-caption uppercase tracking-[0.06em]">
          {errs.length} error span{errs.length === 1 ? "" : "s"} in this trace
        </div>
      )}
      {errs.map((s) => (
        <button
          key={s.spanId}
          type="button"
          className="cursor-pointer rounded-[10px] border border-error-subtle bg-secondary p-3 text-left hover:bg-muted"
          onClick={() => onSelect({ spanId: s.spanId })}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-error-subtle px-[7px] py-[2px] font-mono text-[10.5px] text-error">
              <AlertCircle size={11} /> error
            </span>
            <span className="text-[12px] text-foreground-muted">{s.serviceName}</span>
            <span className="font-mono text-[12.5px] text-foreground">{s.operationName}</span>
            <span className="ml-auto font-mono text-foreground-muted">
              {formatDuration(s.durationMs ?? 0)}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div>
                <div className="text-[11px] text-foreground-caption">span kind</div>
                <div className="break-words font-mono text-[12px] text-foreground">
                  {s.spanKind || "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-foreground-caption">http.status</div>
                <div className="break-words font-mono text-[12px] text-foreground">
                  {s.httpStatusCode ?? "—"}
                </div>
              </div>
              {s.httpMethod && (
                <div>
                  <div className="text-[11px] text-foreground-caption">http.method</div>
                  <div className="break-words font-mono text-[12px] text-foreground">
                    {s.httpMethod}
                  </div>
                </div>
              )}
              {s.statusMessage && (
                <div>
                  <div className="text-[11px] text-foreground-caption">statusMessage</div>
                  <div className="break-words font-mono text-[12px] text-foreground">
                    {s.statusMessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export const ErrorsTab = memo(ErrorsTabComponent);
