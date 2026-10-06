import { useNavigate } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

import { Skeleton } from "@shared/components/primitives/ui/skeleton";
import { PageSurface } from "@shared/components/ui/layout/PageShell";
import { buildTraceDetailHref } from "@shared/observability/deepLinks";
import { formatDuration, formatTimestamp } from "@shared/utils/formatters";

import type { ErrorGroupTrace } from "@shared/api/errors";

interface Props {
  readonly traces: readonly ErrorGroupTrace[];
  readonly loading: boolean;
  readonly page: number;
  readonly hasMore: boolean;
  readonly onPrev: () => void;
  readonly onNext: () => void;
}

export function TracesPanel({
  traces,
  loading,
  page,
  hasMore,
  onPrev,
  onNext,
}: Props): JSX.Element {
  const navigate = useNavigate();

  return (
    <PageSurface padding="lg">
      <div className="mb-1 font-semibold text-[13px] text-foreground">Recent traces</div>
      <div className="mb-3 text-[12px] text-foreground-muted">
        Error occurrences in this window · click to open the trace
      </div>

      {loading && traces.length === 0 ? (
        <Skeleton count={5} />
      ) : traces.length === 0 ? (
        <div className="py-6 text-center text-[12px] text-foreground-muted">
          No traces in the selected range.
        </div>
      ) : (
        <div className="flex flex-col">
          {traces.map((t) => (
            <button
              key={`${t.traceId}-${t.spanId}`}
              type="button"
              onClick={() => {
                navigate({ to: buildTraceDetailHref(t.traceId) as never });
              }}
              className="flex items-center justify-between gap-3 border-border/60 border-b py-2.5 text-left last:border-b-0 hover:bg-muted/20"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <ExternalLink size={13} className="shrink-0 text-foreground-muted" />
                <span className="truncate font-mono text-[12.5px] text-foreground">
                  {t.traceId}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="font-mono text-[11.5px] text-foreground-muted tabular-nums">
                  {formatDuration(t.durationMs)}
                </span>
                <span className="w-[150px] text-right font-mono text-[11px] text-foreground-muted">
                  {formatTimestamp(t.timestamp)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {traces.length > 0 || page > 0 ? (
        <div className="mt-4 flex items-center justify-between border-border/40 border-t pt-4">
          <div className="text-[11.5px] text-foreground-muted">Showing page {page + 1}</div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={onPrev}
              className="inline-flex h-[26px] items-center gap-1 rounded-md border border-border bg-card px-3 font-semibold text-[11px] text-foreground-secondary hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!hasMore}
              onClick={onNext}
              className="inline-flex h-[26px] items-center gap-1 rounded-md border border-border bg-card px-3 font-semibold text-[11px] text-foreground-secondary hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </PageSurface>
  );
}
