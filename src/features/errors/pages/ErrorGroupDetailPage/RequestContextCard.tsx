import { PageSurface } from "@shared/components/ui/layout/PageShell";
import { formatDuration } from "@shared/utils/formatters";

import type { ErrorLatestOccurrence } from "@shared/api/errors";

interface Props {
  readonly occurrence: ErrorLatestOccurrence | null | undefined;
}

interface Row {
  readonly k: string;
  readonly v: string;
  readonly bad?: boolean;
}

/** Key/value request context of the group's most recent error span. */
export function RequestContextCard({ occurrence }: Props): JSX.Element | null {
  if (!occurrence) return null;

  const statusNum = Number.parseInt(occurrence.httpStatusCode, 10);
  const rows: Row[] = [
    { k: "http.method", v: occurrence.httpMethod },
    { k: "http.route", v: occurrence.httpRoute },
    {
      k: "http.status",
      v: occurrence.httpStatusCode,
      bad: Number.isFinite(statusNum) && statusNum >= 400,
    },
    { k: "duration", v: formatDuration(occurrence.durationMs), bad: occurrence.durationMs >= 1000 },
    { k: "traceId", v: occurrence.traceId },
    { k: "spanId", v: occurrence.spanId },
    { k: "service.version", v: occurrence.serviceVersion },
    { k: "env", v: occurrence.environment },
    { k: "kube_pod", v: occurrence.pod },
    { k: "host", v: occurrence.host },
  ].filter((r) => r.v && r.v.length > 0);

  return (
    <PageSurface padding="lg">
      <div className="mb-3 font-semibold text-[13px] text-foreground">
        Request context · latest occurrence
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {rows.map((r) => (
          <div
            key={r.k}
            className="flex items-center justify-between gap-3 border-border/60 border-b pb-2"
          >
            <span className="font-mono text-[12.5px] text-foreground-muted">{r.k}</span>
            <span
              className={`truncate font-mono font-semibold text-[12.5px] ${
                r.bad ? "text-[var(--err)]" : "text-foreground"
              }`}
            >
              {r.v}
            </span>
          </div>
        ))}
      </div>
    </PageSurface>
  );
}
