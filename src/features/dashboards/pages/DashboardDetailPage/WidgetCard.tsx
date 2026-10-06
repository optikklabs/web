import { Pencil, Trash2 } from "lucide-react";

import { Card as Surface } from "@shared/components/primitives/ui/card";
import { useMetricsExplorerQuery } from "@shared/metrics/hooks/useMetricsExplorerQuery";
import type { DashboardPanelSpec } from "@shared/types/dashboardConfig";

import type { Dashboard } from "@shared/dashboards/api/dashboardsApi";
import { panelTypeToViz } from "@shared/dashboards/builder/metricsWidget";
import { WidgetVizRenderer } from "@shared/dashboards/components/WidgetVizRenderer";

const ROW_PX = 88;
const GAP_PX = 12;

function clampSpan(value: number): number {
  if (!Number.isFinite(value)) return 6;
  return Math.min(12, Math.max(1, Math.round(value)));
}

interface WidgetCardProps {
  readonly widget: Dashboard;
  readonly editing: boolean;
  readonly onEdit: () => void;
  readonly onRemove: () => void;
}

export function WidgetCard({ widget, editing, onEdit, onRemove }: WidgetCardProps) {
  const span = clampSpan(widget.spec.layout.w);
  const rows = Math.max(1, Math.round(widget.spec.layout.h || 4));
  const height = rows * ROW_PX + (rows - 1) * GAP_PX;

  return (
    <div className="group relative min-w-0" style={{ gridColumn: `span ${span}`, height }}>
      {editing && (
        <div className="absolute top-1.5 right-1.5 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            title="Edit widget"
            className="flex h-6 w-6 items-center justify-center rounded bg-card/90 text-foreground-muted hover:text-foreground"
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Remove widget"
            className="flex h-6 w-6 items-center justify-center rounded bg-card/90 text-foreground-muted hover:bg-error-subtle hover:text-error"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
      <MetricsWidgetBody spec={widget.spec} bodyHeight={height} />
    </div>
  );
}

/** Renders a metrics-builder widget via the shared WYSIWYG renderer. */
function MetricsWidgetBody({
  spec,
  bodyHeight,
}: {
  readonly spec: DashboardPanelSpec;
  readonly bodyHeight: number;
}) {
  const { query } = spec;
  const result = useMetricsExplorerQuery(query.queries, query.step);

  return (
    <Surface
      elevation={1}
      padding="xs"
      className="chart-card flex h-full min-h-0 flex-col overflow-hidden"
    >
      <div className="chart-card__title">
        <span className="chart-card__title-text">{spec.title}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <WidgetVizRenderer
          viz={panelTypeToViz(spec.panelType)}
          queries={query.queries}
          formulas={query.formulas ?? []}
          results={result.data?.results}
          display={{ legend: spec.legend, smooth: spec.smooth }}
          isLoading={result.isLoading}
          isError={result.isError}
          height={Math.max(120, bodyHeight - 44)}
        />
      </div>
    </Surface>
  );
}
