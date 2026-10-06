import { Link, useLocation } from "@tanstack/react-router";
import React from "react";

import { getDomainNavigationItems } from "@/app/registry/domainRegistry";
import { ROUTES } from "@/shared/constants/routes";

import { type BreadcrumbItem, Breadcrumbs } from "@shared/components/primitives/ui/breadcrumb";
import { cn } from "@shared/lib/utils";

function formatSegmentLabel(segment: string): string {
  return segment.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

interface BreadcrumbRule {
  match: (pathname: string, segments: string[]) => boolean;
  build: (segments: string[], navLookup: Map<string, string>) => BreadcrumbItem[];
}

const BREADCRUMB_RULES: BreadcrumbRule[] = [
  {
    match: (pathname) => pathname === ROUTES.traceCompare,
    build: (_, navLookup) => [
      { label: navLookup.get(ROUTES.traces) ?? "Traces", path: ROUTES.traces },
      { label: "Compare" },
    ],
  },
  {
    match: (pathname, segments) =>
      pathname.startsWith("/traces/") && segments.length === 2 && segments[1] !== "compare",
    build: (segments, navLookup) => [
      { label: navLookup.get(ROUTES.traces) ?? "Traces", path: ROUTES.traces },
      { label: segments[1] },
    ],
  },
  {
    match: (pathname, segments) =>
      pathname.startsWith("/saturation/kafka/topics/") && segments.length === 4,
    build: (segments, navLookup) => [
      { label: navLookup.get(ROUTES.saturation) ?? "Saturation", path: ROUTES.saturation },
      { label: "Kafka", path: ROUTES.saturation },
      { label: segments[3] },
    ],
  },
  {
    match: (pathname, segments) =>
      pathname.startsWith("/saturation/kafka/groups/") && segments.length === 4,
    build: (segments, navLookup) => [
      { label: navLookup.get(ROUTES.saturation) ?? "Saturation", path: ROUTES.saturation },
      { label: "Kafka", path: ROUTES.saturation },
      { label: "Consumer Groups" },
      { label: segments[3] },
    ],
  },
  {
    match: (pathname, segments) => pathname.startsWith("/database/query/") && segments.length === 3,
    build: (segments, navLookup) => [
      { label: navLookup.get(ROUTES.database) ?? "Database", path: ROUTES.database },
      { label: "Queries", path: ROUTES.databaseQueries },
      { label: `Query #${(segments[2] ?? "").slice(0, 6)}` },
    ],
  },
  {
    match: (pathname, segments) =>
      pathname.startsWith("/saturation/datastores/") && segments.length === 3,
    build: (segments, navLookup) => [
      { label: navLookup.get(ROUTES.saturation) ?? "Saturation", path: ROUTES.saturation },
      { label: "Data Stores", path: ROUTES.saturation },
      { label: segments[2] },
    ],
  },
];

function buildDynamicCrumbs(pathname: string): BreadcrumbItem[] {
  const navLookup = new Map(
    getDomainNavigationItems().map((entry) => [entry.path, entry.label] as const)
  );

  const rootCrumbs: BreadcrumbItem[] = [];
  const segments = pathname.split("/").filter(Boolean);

  const rule = BREADCRUMB_RULES.find((r) => r.match(pathname, segments));
  if (rule) {
    return rule.build(segments, navLookup);
  }

  const directNav = getDomainNavigationItems().find((entry) => entry.path === pathname);
  if (directNav) {
    rootCrumbs.push({ label: directNav.label, path: directNav.path });
    return rootCrumbs;
  }

  if (segments.length === 0) {
    return rootCrumbs;
  }

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const navEntry = getDomainNavigationItems().find((entry) => entry.path === currentPath);
    rootCrumbs.push({
      label: navEntry?.label ?? formatSegmentLabel(segment),
      path: currentPath === pathname ? undefined : currentPath,
    });
  }

  return rootCrumbs;
}

interface PageHeaderBreadcrumb {
  label: React.ReactNode;
  path?: string;
}

interface PageHeaderProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: PageHeaderBreadcrumb[];
  /** Auto-generate breadcrumbs from current route (overrides manual breadcrumbs) */
  autoBreadcrumbs?: boolean;
  className?: string;
}

export default function PageHeader({
  title,
  icon,
  subtitle,
  actions,
  breadcrumbs = [],
  autoBreadcrumbs = true,
  className,
}: PageHeaderProps) {
  const location = useLocation();
  const routeCrumbs = buildDynamicCrumbs(location.pathname);

  const showAutoCrumbs = autoBreadcrumbs && breadcrumbs.length === 0 && routeCrumbs.length > 1;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {showAutoCrumbs && (
        <Breadcrumbs items={routeCrumbs} className="text-[11px] text-foreground-muted" />
      )}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 text-[11px]">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={`${String(breadcrumb.label)}-${index}`}>
              {index > 0 ? <span className="text-foreground-muted opacity-50">/</span> : null}
              {breadcrumb.path ? (
                <Link
                  to={breadcrumb.path}
                  className="font-medium text-foreground-muted no-underline transition-colors hover:text-primary"
                >
                  {breadcrumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground-secondary">{breadcrumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon && <div className="mt-0.5 flex items-center text-foreground-secondary">{icon}</div>}
          <div className="min-w-0">
            <h1 className="m-0 font-semibold text-[1.625rem] text-foreground leading-[1.15] tracking-[-0.02em]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 max-w-3xl text-[13px] text-foreground-secondary leading-6">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
