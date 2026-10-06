import { useParams } from "@tanstack/react-router";
import { AlertOctagon } from "lucide-react";
import { useEffect, useState } from "react";

import { Card as Surface } from "@shared/components/primitives/ui/card";
import PageHeader from "@shared/components/ui/layout/PageHeader";
import { PageShell, PageSurface } from "@shared/components/ui/layout/PageShell";
import { useTimeRangeQuery } from "@shared/hooks/useTimeRangeQuery";
import { formatNumber, formatTimestamp } from "@shared/utils/formatters";

import {
  getErrorGroupDetail,
  getErrorGroupFacets,
  getErrorGroupLatestOccurrence,
  getErrorGroupTimeseries,
  getErrorGroupTraces,
} from "@shared/api/errors";

import { RequestContextCard } from "./RequestContextCard";
import { TracesPanel } from "./TracesPanel";
import { WhereItHappensCard } from "./WhereItHappensCard";

function MetaStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[11px] text-foreground-muted uppercase tracking-[0.08em]">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-bold text-[17px] text-foreground tabular-nums tracking-[-0.01em]">
          {value}
        </span>
        {sub ? <span className="text-[12.5px] text-foreground-muted">{sub}</span> : null}
      </div>
    </div>
  );
}

/** Error-volume bars, one per timeseries bucket, scaled to the window's peak. */
function OccurrenceTimeline({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts);
  return (
    <PageSurface padding="lg">
      <div className="font-semibold text-[13px] text-foreground">Occurrences over time</div>
      <div className="mt-0.5 text-[12px] text-foreground-muted">
        Error volume · grouped by minute
      </div>
      <div className="mt-4 flex h-[150px] items-end gap-[2px]">
        {counts.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-[12px] text-foreground-muted">
            No occurrences in this window.
          </div>
        ) : (
          counts.map((c, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[2px] bg-[var(--err)] opacity-75"
              style={{ height: `${6 + (c / max) * 134}px` }}
              title={`${c}`}
            />
          ))
        )}
      </div>
    </PageSurface>
  );
}

export default function ErrorGroupDetailPage(): JSX.Element {
  const params = useParams({ strict: false });
  const groupId = decodeURIComponent(typeof params.groupId === "string" ? params.groupId : "");

  const detailQ = useTimeRangeQuery(
    `error-group-detail-${groupId}`,
    (s, e) => getErrorGroupDetail(groupId, Number(s), Number(e)),
    { extraKeys: [groupId], enabled: !!groupId }
  );
  const occurrenceQ = useTimeRangeQuery(
    `error-group-latest-${groupId}`,
    (s, e) => getErrorGroupLatestOccurrence(groupId, Number(s), Number(e)),
    { extraKeys: [groupId], enabled: !!groupId }
  );
  const timeseriesQ = useTimeRangeQuery(
    `error-group-ts-${groupId}`,
    (s, e) => getErrorGroupTimeseries(groupId, Number(s), Number(e)),
    { extraKeys: [groupId], enabled: !!groupId }
  );
  const facetsQ = useTimeRangeQuery(
    `error-group-facets-${groupId}`,
    (s, e) => getErrorGroupFacets(groupId, Number(s), Number(e)),
    { extraKeys: [groupId], enabled: !!groupId }
  );
  const [tracePage, setTracePage] = useState(0);
  const [traceCursors, setTraceCursors] = useState<Record<number, string>>({});
  const traceCursor = tracePage > 0 ? traceCursors[tracePage - 1] : undefined;

  const tracesQ = useTimeRangeQuery(
    `error-group-traces-${groupId}`,
    (s, e) => getErrorGroupTraces(groupId, Number(s), Number(e), { cursor: traceCursor }),
    { extraKeys: [groupId, tracePage, traceCursor], enabled: !!groupId }
  );

  const traceResults = tracesQ.data?.results ?? [];
  const traceHasMore = tracesQ.data?.pageInfo.hasMore ?? false;
  const traceNextCursor = tracesQ.data?.pageInfo.nextCursor;

  useEffect(() => {
    if (traceNextCursor) {
      setTraceCursors((prev) => ({ ...prev, [tracePage]: traceNextCursor }));
    }
  }, [traceNextCursor, tracePage]);

  const detail = detailQ.data;
  const occurrence = occurrenceQ.data;
  const points = timeseriesQ.data ?? [];
  // The API answers 404 when the group has no errors in the selected window.
  const absent = detailQ.error?.status === 404;

  const cutoff = Date.now() - 3_600_000;
  const lastHour = points.reduce((a, p) => (p.timestampMs >= cutoff ? a + p.errorCount : a), 0);

  const title = detail?.exceptionType || detail?.operationName || groupId;

  return (
    <PageShell>
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 rounded-full bg-[var(--err)]"
              style={{ boxShadow: "0 0 0 4px var(--err-soft)" }}
            />
            <span className="font-mono">{title}</span>
          </span>
        }
        subtitle={
          detail
            ? `${detail.serviceName} · ${detail.operationName}`
            : detailQ.isPending
              ? "Loading…"
              : absent
                ? "No occurrences in this window"
                : "Failed to load this error group"
        }
        icon={<AlertOctagon size={24} className="text-[var(--err)]" />}
      />

      <Surface elevation={1} padding="md">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetaStat
            label="First seen"
            value={detail ? formatTimestamp(detail.firstOccurrence) : "—"}
          />
          <MetaStat
            label="Last seen"
            value={detail ? formatTimestamp(detail.lastOccurrence) : "—"}
          />
          <MetaStat
            label="Occurrences"
            value={detail ? formatNumber(detail.errorCount) : "—"}
            sub={`${formatNumber(lastHour)} in 1h`}
          />
        </div>
      </Surface>

      <OccurrenceTimeline counts={points.map((p) => p.errorCount)} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.55fr_1fr]">
        <RequestContextCard occurrence={occurrence} />
        <WhereItHappensCard groups={facetsQ.data ?? []} />
      </div>

      <TracesPanel
        traces={traceResults}
        loading={tracesQ.isPending}
        page={tracePage}
        hasMore={traceHasMore}
        onPrev={() => setTracePage((p) => Math.max(0, p - 1))}
        onNext={() => setTracePage((p) => p + 1)}
      />
    </PageShell>
  );
}
