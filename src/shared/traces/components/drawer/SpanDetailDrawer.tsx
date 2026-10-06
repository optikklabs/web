import { ScrollText } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";

import type { TraceLog, TraceRecord } from "@shared/api/traces/schemas";
import { DrawerJson } from "@shared/components/ui/overlay/detail-drawer/DrawerJson";
import { DrawerShell } from "@shared/components/ui/overlay/detail-drawer/DrawerShell";
import { DrawerTabs } from "@shared/components/ui/overlay/detail-drawer/DrawerTabs";

import type { RelatedTrace, SpanAttributes, SpanEvent } from "../../types/detail";
import { type SelectedSpan, SpanDrawerHeader } from "./SpanDrawerHeader";
import { SpanDrawerLogs } from "./SpanDrawerLogs";
import { SpanInfoTab } from "./tabs/SpanInfoTab";

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly span: SelectedSpan | null;
  readonly spanId: string | null;
  readonly spans: readonly TraceRecord[];
  readonly traceId: string;
  readonly spanAttributes: SpanAttributes | null;
  readonly spanAttributesLoading: boolean;
  readonly spanEvents: readonly SpanEvent[];
  readonly relatedTraces: readonly RelatedTrace[];
  readonly relatedTracesRequested: boolean;
  readonly relatedTracesLoading: boolean;
  readonly onLoadRelatedTraces?: () => void;
  readonly traceLogs: readonly TraceLog[];
  readonly traceStartMs?: number;
  readonly traceEndMs?: number;
  readonly isCritical: boolean;
  readonly onSpanClick: (span: { spanId: string }) => void;
  readonly onAddFilter?: (key: string, value: string) => void;
  readonly onOpenInLogs?: () => void;
}

type SpanTab = "info" | "json" | "logs";

function SpanDetailDrawerComponent(props: Props) {
  const { span, spanId, spans, traceId, traceLogs, onClose, open } = props;
  const [tab, setTab] = useState<SpanTab>("info");

  useEffect(() => {
    if (open) setTab("info");
  }, [open]);

  const record = useMemo(
    () => (spanId ? (spans.find((s) => s.spanId === spanId) ?? null) : null),
    [spans, spanId]
  );

  const spanLogs = useMemo(
    () => (spanId ? traceLogs.filter((l) => l.spanId === spanId) : []),
    [traceLogs, spanId]
  );

  const jsonDoc = useMemo(() => {
    if (!record) return { spanId };
    return {
      spanId: record.spanId,
      traceId: record.traceId || traceId,
      parentSpanId: record.parentSpanId ?? null,
      name: record.operationName,
      service: record.serviceName,
      kind: record.spanKind,
      status: record.status,
      durationMs: record.durationMs,
      startTime: record.startTime,
      endTime: record.endTime,
      attributes: props.spanAttributes?.attributesString ?? {},
      resource: props.spanAttributes?.resourceAttributes ?? {},
    };
  }, [record, spanId, traceId, props.spanAttributes]);

  if (!span || !spanId) return null;

  const footer = props.onOpenInLogs ? (
    <>
      <span className="flex-1" />
      <button
        type="button"
        onClick={props.onOpenInLogs}
        className="inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-md border-0 bg-[var(--accent)] px-3 text-[12px] text-[var(--accent-fg,oklch(0.99_0.005_270))] hover:bg-[var(--accent-2)]"
      >
        <ScrollText size={13} /> View span logs
      </button>
    </>
  ) : undefined;

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      title="Span details"
      width="min(560px, calc(100vw - 24px))"
      footer={footer}
    >
      <SpanDrawerHeader
        span={span}
        spanId={spanId}
        isCritical={props.isCritical}
        traceStartMs={props.traceStartMs}
        traceEndMs={props.traceEndMs}
        onClose={onClose}
      />

      <DrawerTabs
        tabs={[
          { id: "info", label: "Info" },
          { id: "json", label: "JSON" },
          { id: "logs", label: "Logs", badge: spanLogs.length || null },
        ]}
        active={tab}
        onChange={(id) => setTab(id as SpanTab)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-4">
        {tab === "info" && (
          <SpanInfoTab
            spanAttributes={props.spanAttributes}
            loading={props.spanAttributesLoading}
            spans={spans}
            selectedSpanId={spanId}
            spanEvents={props.spanEvents}
            relatedTraces={props.relatedTraces}
            relatedTracesRequested={props.relatedTracesRequested}
            relatedTracesLoading={props.relatedTracesLoading}
            onLoadRelatedTraces={props.onLoadRelatedTraces}
            traceStartMs={props.traceStartMs}
            traceEndMs={props.traceEndMs}
            onSpanClick={props.onSpanClick}
            onAddFilter={props.onAddFilter}
          />
        )}

        {tab === "json" && <DrawerJson data={jsonDoc} />}

        {tab === "logs" && <SpanDrawerLogs spanLogs={spanLogs} onOpenInLogs={props.onOpenInLogs} />}
      </div>
    </DrawerShell>
  );
}

export const SpanDetailDrawer = memo(SpanDetailDrawerComponent);
