import { ExternalLink, ScrollText, Waypoints } from "lucide-react";

import {
  DrawerHeader,
  DrawerIconButton,
} from "@shared/components/ui/overlay/detail-drawer/DrawerHeader";
import { DrawerKpi } from "@shared/components/ui/overlay/detail-drawer/DrawerKpi";
import { DrawerMiniSignal } from "@shared/components/ui/overlay/detail-drawer/DrawerMiniSignal";
import { DrawerSection } from "@shared/components/ui/overlay/detail-drawer/DrawerSection";
import { DrawerShell } from "@shared/components/ui/overlay/detail-drawer/DrawerShell";
import { formatDuration, formatNumber, formatPercentage } from "@shared/utils/formatters";

import { ServiceDrawerDependenciesSection } from "./components/ServiceDrawerDependenciesSection";
import { ServiceDrawerEndpointsSection } from "./components/ServiceDrawerEndpointsSection";
import { useServiceDetailDrawerModel } from "./hooks/useServiceDetailDrawerModel";
import type { ServiceDetailDrawerProps } from "./types";
import { healthLabelForErrorRate, healthVariantForErrorRate, readNumber } from "./utils";

const STATUS_COLOR = {
  success: "var(--ok)",
  warning: "var(--warn)",
  error: "var(--err)",
} as const;

function initialsOf(name: string): string {
  return name
    .split(/[-_\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Version, environment, language, and instance count, when the caller supplied them. */
function serviceMetaBits(initialData: ServiceDetailDrawerProps["initialData"]): string[] {
  const out: string[] = [];
  const version = typeof initialData?.version === "string" ? initialData.version : null;
  const environment =
    typeof initialData?.environment === "string" && initialData.environment !== "—"
      ? initialData.environment
      : null;
  const lang = typeof initialData?.lang === "string" ? initialData.lang : null;
  const instances = readNumber(initialData?.instances);
  if (version) out.push(version);
  if (environment) out.push(environment);
  if (lang) out.push(lang);
  if (instances != null) out.push(`${instances} inst`);
  return out;
}

export default function ServiceDetailDrawer({
  open,
  onClose,
  serviceName,
  title,
  initialData,
}: ServiceDetailDrawerProps) {
  const model = useServiceDetailDrawerModel(serviceName, title, initialData);
  const m = model.summaryMetrics;
  const variant = healthVariantForErrorRate(m?.errorRate);
  const statusColor = STATUS_COLOR[variant];

  const requestSpark = model.requestTrendSeries.map((p) => p.requestCount);
  const errorSpark = model.errorTrendSeries.map((p) => p.errorRate);
  const latencySpark = model.latencyTrendSeries.map((p) => p.p99Ms);

  const metaBits = serviceMetaBits(initialData);

  const footer = (
    <>
      <button
        type="button"
        onClick={model.openLogs}
        className="inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg-card)] px-2.5 text-[12px] text-[var(--fg-1)] hover:bg-[var(--bg-inset)] hover:text-[var(--fg-0)]"
      >
        <ScrollText size={13} /> Logs
      </button>
      <button
        type="button"
        onClick={model.openTraces}
        className="inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg-card)] px-2.5 text-[12px] text-[var(--fg-1)] hover:bg-[var(--bg-inset)] hover:text-[var(--fg-0)]"
      >
        <Waypoints size={13} /> Traces
      </button>
      <span className="flex-1" />
      <button
        type="button"
        onClick={model.openFullView}
        className="inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-md border-0 bg-[var(--accent)] px-3 text-[12px] text-[var(--accent-fg,oklch(0.99_0.005_270))] hover:bg-[var(--accent-2)]"
      >
        Open service <ExternalLink size={13} />
      </button>
    </>
  );

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      width="min(620px, calc(100vw - 24px))"
      footer={footer}
    >
      <DrawerHeader
        onClose={onClose}
        actions={
          <DrawerIconButton
            icon={<ExternalLink size={14} />}
            title="Open full page"
            onClick={model.openFullView}
          />
        }
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] font-semibold text-[16px] text-[var(--accent-fg,oklch(0.99_0.005_270))]"
            style={{ background: "linear-gradient(135deg, var(--accent-violet), var(--accent))" }}
          >
            {initialsOf(model.serviceLabel)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-bold text-[17px] text-[var(--fg-0)]">
                {model.serviceLabel}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold text-[11px]"
                style={{
                  color: statusColor,
                  background: "var(--bg-inset)",
                  border: `1px solid ${statusColor}`,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} />
                {healthLabelForErrorRate(m?.errorRate)}
              </span>
            </div>
            {metaBits.length > 0 && (
              <div className="mt-1 font-mono text-[12px] text-[var(--fg-3)]">
                {metaBits.join(" · ")}
              </div>
            )}
          </div>
        </div>
      </DrawerHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-[18px] py-4">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-2.5">
            <DrawerKpi
              label="Requests"
              value={formatNumber(m?.requestCount ?? 0)}
              spark={requestSpark}
              sparkTone="info"
            />
            <DrawerKpi
              label="Error rate"
              value={formatPercentage(m?.errorRate ?? 0)}
              spark={errorSpark}
              sparkTone={variant === "error" ? "err" : "warn"}
            />
            <DrawerKpi
              label="Latency p99"
              value={formatDuration(m?.p99Latency ?? 0)}
              spark={latencySpark}
              sparkTone="err"
            />
          </div>

          <DrawerSection
            title="Golden signals"
            action={<span className="text-[11.5px] text-[var(--fg-3)]">active range</span>}
          >
            <div className="grid grid-cols-2 gap-4 px-0.5 pt-0.5">
              <DrawerMiniSignal
                label="Request rate"
                legend={formatNumber(m?.requestCount ?? 0)}
                values={requestSpark}
                tone="info"
              />
              <DrawerMiniSignal
                label="Error rate"
                legend={formatPercentage(m?.errorRate ?? 0)}
                values={errorSpark}
                tone={variant === "error" ? "err" : "warn"}
              />
              <DrawerMiniSignal
                label="Latency p99"
                legend={formatDuration(m?.p99Latency ?? 0)}
                values={latencySpark}
                tone="err"
              />
              <DrawerMiniSignal
                label="Latency p95"
                legend={formatDuration(m?.p95Latency ?? 0)}
                values={model.latencyTrendSeries.map((p) => p.p95Ms)}
                tone="warn"
              />
            </div>
          </DrawerSection>

          <DrawerSection title="Health">
            {variant === "success" ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-[var(--line-2)] bg-[var(--ok-soft)] px-3 py-3 text-[13px] text-[var(--fg-0)]">
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--ok)" }} />
                No active alerts · error rate within budget
              </div>
            ) : (
              <div
                className="rounded-lg border px-3 py-3"
                style={{
                  background: variant === "error" ? "var(--err-soft)" : "var(--warn-soft)",
                  borderColor: variant === "error" ? "var(--err)" : "var(--warn)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="font-semibold text-[13px]"
                    style={{ color: variant === "error" ? "var(--err-fg)" : "var(--warn-fg)" }}
                  >
                    {healthLabelForErrorRate(m?.errorRate)} · error budget at risk
                  </span>
                  <span className="font-mono text-[12px] text-[var(--fg-2)]">
                    {formatPercentage(m?.errorRate ?? 0)}
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-[var(--fg-3)]">
                  Error rate is above the healthy threshold for this service.
                </div>
              </div>
            )}
          </DrawerSection>
        </div>

        <ServiceDrawerEndpointsSection
          isError={model.endpointsQuery.isError}
          isLoading={model.endpointsLoading}
          endpointRows={model.endpointRows}
        />

        <ServiceDrawerDependenciesSection
          isError={model.dependenciesQuery.isError}
          isLoading={model.dependenciesLoading}
          upstreamRows={model.upstreamRows}
          downstreamRows={model.downstreamRows}
        />
      </div>
    </DrawerShell>
  );
}
