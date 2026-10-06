import { Button } from "@shared/components/primitives/ui/button";
import { Card as Surface } from "@shared/components/primitives/ui/card";
import { UNKNOWN_ERROR } from "@shared/constants/errorCodes";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { type FallbackProps, ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

import ChartErrorOverlay from "./ChartErrorOverlay";

import type { ErrorBoundaryProps } from "./types";

interface PageFallbackProps extends FallbackProps {
  showDetails?: boolean;
  boundaryName?: string;
  resetOnError?: boolean;
}

// Full-page fallback for app-shell level boundaries.
function PageFallback({
  error,
  resetErrorBoundary,
  showDetails,
  boundaryName,
  resetOnError,
}: PageFallbackProps) {
  const handleReset = () => {
    resetErrorBoundary();
    if (resetOnError) {
      window.location.reload();
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 400, padding: 24 }}>
      <div className="flex-col items-center gap-lg" style={{ textAlign: "center", maxWidth: 420 }}>
        <AlertCircle size={48} color="var(--color-error)" />
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
          Something went wrong
        </h2>
        <p className="text-secondary text-sm">
          {showDetails && error
            ? error.toString()
            : "We're sorry for the inconvenience. Please try refreshing the page."}
        </p>
        {showDetails && boundaryName && (
          <p className="text-secondary text-sm" style={{ marginTop: 8 }}>
            Boundary: {boundaryName}
          </p>
        )}
        <div className="flex gap-sm">
          <Button variant="primary" onClick={handleReset}>
            Try Again
          </Button>
          <Button variant="secondary" onClick={() => window.location.assign("/")}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

// Card-sized fallback for charts, maps and other visualizations.
function VisualizationFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-4 text-center">
      <div className="mb-3 rounded-full bg-err/10 p-3 text-err">
        <AlertTriangle size={24} />
      </div>
      <h3 className="font-semibold text-foreground">Visualization Error</h3>
      <p className="mt-1 max-w-[400px] text-[13px] text-foreground-muted">
        We encountered an unexpected error while trying to render this visualization.
      </p>
      {import.meta.env.DEV && (
        <pre className="mt-2 max-w-full overflow-auto rounded bg-muted/20 p-2 text-left text-[11px] text-err opacity-80">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      )}
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mt-4 rounded-md border border-border bg-muted/20 px-4 py-1.5 font-medium text-[13px] transition-colors hover:bg-muted/40"
      >
        Try Again
      </button>
    </div>
  );
}

interface PanelFallbackProps extends FallbackProps {
  title?: React.ReactNode;
  showDetails?: boolean;
}

// Dashboard-panel fallback that keeps the card chrome and title.
function PanelFallback({ error, title, showDetails }: PanelFallbackProps) {
  const detailMessage = showDetails && error instanceof Error ? error.message : null;
  return (
    <Surface
      elevation={1}
      padding="xs"
      className="chart-card flex flex-col"
      style={{ height: "100%", overflow: "hidden" }}
    >
      <div className="chart-card__title">{title}</div>
      <ChartErrorOverlay
        code={UNKNOWN_ERROR}
        message={detailMessage ?? "This panel failed to render."}
      />
    </Surface>
  );
}

/**
 * The single shared error boundary, built on react-error-boundary.
 * `variant` selects the fallback UI: "page" (default) for app-shell scopes,
 * "visualization" for chart/map cards, "panel" for dashboard panels.
 * Pass `fallback` to fully override the rendered fallback.
 */
export default function ErrorBoundary({
  children,
  variant = "page",
  fallback,
  showDetails,
  boundaryName,
  resetOnError,
  title,
}: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      fallbackRender={(props) => {
        if (fallback) return <>{fallback}</>;
        if (variant === "visualization") return <VisualizationFallback {...props} />;
        if (variant === "panel") {
          return <PanelFallback {...props} title={title} showDetails={showDetails} />;
        }
        return (
          <PageFallback
            {...props}
            showDetails={showDetails}
            boundaryName={boundaryName}
            resetOnError={resetOnError}
          />
        );
      }}
      onError={(error, info) => {
        console.error(
          `Error Boundary caught an error${boundaryName ? ` [${boundaryName}]` : ""}:`,
          error,
          info
        );
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
