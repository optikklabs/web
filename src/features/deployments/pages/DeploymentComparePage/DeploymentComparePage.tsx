import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, GitBranch, Rocket } from "lucide-react";
import { useMemo } from "react";

import { APP_COLORS } from "@config/colorLiterals";
import { Button } from "@shared/components/primitives/ui/button";
import ObservabilityChart from "@shared/components/ui/charts/ObservabilityChart";
import EmptyState from "@shared/components/ui/feedback/EmptyState";
import Loading from "@shared/components/ui/feedback/Loading";
import PageHeader from "@shared/components/ui/layout/PageHeader";
import { PageShell, PageSurface } from "@shared/components/ui/layout/PageShell";
import {
  buildDeploymentErrorsHref,
  buildDeploymentTracesHref,
} from "@shared/observability/deepLinks";
import { encodeFilters } from "@shared/search/utils/urlState";
import { pickCyclic } from "@shared/utils/cyclic";
import { formatNumber, formatTimestamp } from "@shared/utils/formatters";

import {
  useDeploymentCompare,
  useDeploymentDependencies,
  useDeploymentEndpoints,
  useDeploymentErrors,
  useDeploymentTraffic,
} from "../../hooks/useDeployments";
import { DimensionCard, ErrorChangesCard, MetricMatrix } from "./ComparisonSections";

const SERIES_COLORS = [
  APP_COLORS.hex_5e60ce,
  APP_COLORS.hex_06aed5,
  APP_COLORS.hex_06d6a0,
  APP_COLORS.hex_f79009,
  APP_COLORS.hex_ef476f,
] as const;

export default function DeploymentComparePage() {
  const { service, version } = useParams({ from: "/_app/deployments/$service/$version" });
  const search = useSearch({ from: "/_app/deployments/$service/$version" });
  const navigate = useNavigate();
  const identity = { service, version, environment: search.env };

  const compare = useDeploymentCompare(identity);
  const traffic = useDeploymentTraffic(identity);
  const errors = useDeploymentErrors(identity);
  const endpoints = useDeploymentEndpoints(identity);
  const dependencies = useDeploymentDependencies(identity);

  const trafficSeries = useMemo(
    () =>
      (traffic.data?.series ?? []).map((entry, index) => ({
        label: entry.version,
        values: entry.requests,
        color: pickCyclic(SERIES_COLORS, index),
        fill: entry.version === version,
        width: entry.version === version ? 2.5 : 1.5,
      })),
    [traffic.data?.series, version]
  );
  const timestamps = useMemo(
    () => (traffic.data?.timestamps ?? []).map((timestamp) => timestamp / 1000),
    [traffic.data?.timestamps]
  );
  const deploymentMarkers = useMemo(
    () =>
      compare.data
        ? [
            {
              atSeconds: new Date(compare.data.context.firstSeen).getTime() / 1000,
              label: `${version} first seen`,
              kind: "deployment" as const,
            },
          ]
        : [],
    [compare.data, version]
  );

  if (search.env === undefined) {
    return (
      <PageShell>
        <PageHeader title={`${service} · ${version}`} icon={<Rocket size={24} />} />
        <PageSurface>
          <EmptyState
            title="Environment required"
            description="Open this deployment from the list so its environment identity is included."
          />
        </PageSurface>
      </PageShell>
    );
  }

  if (compare.isPending) {
    return (
      <PageShell>
        <PageHeader title={`${service} · ${version}`} icon={<Rocket size={24} />} />
        <Loading label="Building equal-window comparison…" />
      </PageShell>
    );
  }

  if (compare.isError) {
    return (
      <PageShell>
        <PageHeader title={`${service} · ${version}`} icon={<Rocket size={24} />} />
        <PageSurface>
          <EmptyState title="Deployment unavailable" description={compare.error.message} />
        </PageSurface>
      </PageShell>
    );
  }

  const context = compare.data.context;
  const currentStart = new Date(context.window.currentStart).getTime();
  const currentEnd = new Date(context.window.currentEnd).getTime();
  const traceHref = buildDeploymentTracesHref({
    service,
    version,
    environment: context.environment,
    fromMs: currentStart,
    toMs: currentEnd,
  });
  const errorsHref = buildDeploymentErrorsHref({
    service,
    version,
    environment: context.environment,
    fromMs: currentStart,
    toMs: currentEnd,
  });

  return (
    <PageShell>
      <PageHeader
        title={
          <span className="flex flex-wrap items-baseline gap-2">
            <span>{service}</span>
            <span className="font-mono text-[18px] text-primary">{version}</span>
          </span>
        }
        icon={<Rocket size={24} />}
        breadcrumbs={[
          { label: "Deployments", path: "/deployments" },
          { label: `${service} · ${version}` },
        ]}
        subtitle={
          <span>
            {context.environment} · first observed {formatTimestamp(context.firstSeen)} · baseline{" "}
            <span className="font-mono">
              {context.baselineVersion ?? "unavailable in selected range"}
            </span>
          </span>
        }
        actions={
          <>
            <Button
              size="sm"
              variant="ghost"
              icon={<ArrowLeft size={14} />}
              onClick={() =>
                void navigate({
                  to: "/deployments",
                  search: {
                    from: search.from,
                    to: search.to,
                    tz: search.tz,
                    filters: search.env
                      ? encodeFilters([{ field: "environment", op: "eq", value: search.env }])
                      : undefined,
                  },
                })
              }
            >
              Back
            </Button>
            <a
              href={traceHref}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[var(--card-radius)] border border-border bg-muted px-3 font-medium text-[12px] text-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-accent"
            >
              <GitBranch size={14} /> View traces <ArrowUpRight size={12} />
            </a>
            <a
              href={errorsHref}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[var(--card-radius)] border border-border bg-muted px-3 font-medium text-[12px] text-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-accent"
            >
              View errors <ArrowUpRight size={12} />
            </a>
          </>
        }
      />

      <PageSurface padding="md" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="m-0 font-semibold text-[14px] text-foreground">
              Traffic shift by version
            </h2>
            <p className="mt-1 mb-0 text-[11px] text-foreground-muted">
              Requests per adaptive time bucket across the baseline and current windows.
            </p>
          </div>
          <span className="font-mono text-[11px] text-foreground-muted">
            {formatNumber(
              traffic.data?.series.reduce(
                (total, entry) =>
                  total + entry.requests.reduce((seriesTotal, value) => seriesTotal + value, 0),
                0
              ) ?? 0
            )}{" "}
            requests
          </span>
        </div>
        {traffic.isError ? (
          <div className="rounded-md border border-error/30 bg-error-subtle px-3 py-8 text-center text-[11.5px] text-error">
            Traffic could not be loaded. {traffic.error.message}
          </div>
        ) : timestamps.length === 0 && !traffic.isPending ? (
          <EmptyState title="No traffic" description="No versioned requests were observed." />
        ) : (
          <ObservabilityChart
            timestamps={timestamps}
            series={trafficSeries}
            type="area"
            height={260}
            legend
            isLoading={traffic.isPending}
            yFormatter={(value) => formatNumber(value)}
            markers={deploymentMarkers}
          />
        )}
      </PageSurface>

      <MetricMatrix comparison={compare.data} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ErrorChangesCard
          title="New error types"
          description="Present in the current version window and absent from the baseline."
          rows={errors.data?.new ?? []}
          loading={errors.isPending}
          error={
            errors.isError
              ? `Error changes could not be loaded. ${errors.error.message}`
              : undefined
          }
        />
        <ErrorChangesCard
          title="Resolved error types"
          description="Present in the baseline and absent from the current version window."
          rows={errors.data?.resolved ?? []}
          loading={errors.isPending}
          error={
            errors.isError
              ? `Error changes could not be loaded. ${errors.error.message}`
              : undefined
          }
        />
      </div>

      <DimensionCard
        title="Endpoint diff"
        description="HTTP route metrics for the same equal-length windows."
        rows={endpoints.data?.results ?? []}
        loading={endpoints.isPending}
        error={
          endpoints.isError
            ? `Endpoint comparison could not be loaded. ${endpoints.error.message}`
            : undefined
        }
      />
      <DimensionCard
        title="Dependency diff"
        description="Client-observed peer metrics for the same equal-length windows."
        rows={dependencies.data?.results ?? []}
        loading={dependencies.isPending}
        error={
          dependencies.isError
            ? `Dependency comparison could not be loaded. ${dependencies.error.message}`
            : undefined
        }
      />
    </PageShell>
  );
}
