import { QUERY_LABELS, createDefaultQuery } from "@shared/metrics/constants";
import type {
  FormulaDefinition,
  MetricQueryDefinition,
  MetricSpaceAggregation,
  TimeStep,
} from "@shared/metrics/types";
import type {
  DashboardLayout,
  DashboardLayoutVariant,
  DashboardMetricsQuerySpec,
  DashboardPanelSpec,
  DashboardPanelType,
} from "@shared/types/dashboardConfig";

import type { CreateWidgetPayload } from "../api/dashboardsApi";

/** The four visualizations renderable from the basic metrics engine. */
export type WidgetVizType = "timeseries" | "value" | "toplist" | "table";

/** Grid footprint presets exposed in the editor's size selector. */
export type WidgetSize = "sm" | "md" | "lg" | "full";

export interface WidgetDisplayOptions {
  readonly legend: boolean;
  readonly smooth: boolean;
}

/** Local editor state for the full-window widget editor (no URL coupling). */
export interface WidgetEditorState {
  readonly title: string;
  readonly viz: WidgetVizType;
  readonly queries: MetricQueryDefinition[];
  readonly formulas: FormulaDefinition[];
  readonly step: TimeStep;
  readonly spaceAgg: MetricSpaceAggregation;
  readonly display: WidgetDisplayOptions;
  readonly size: WidgetSize;
}

const VIZ_TO_PANEL: Record<WidgetVizType, DashboardPanelType> = {
  timeseries: "metrics-timeseries",
  value: "metrics-value",
  toplist: "metrics-toplist",
  table: "metrics-table",
};

const VIZ_TO_VARIANT: Record<WidgetVizType, DashboardLayoutVariant> = {
  timeseries: "standard-chart",
  value: "kpi",
  toplist: "ranking",
  table: "detail-table",
};

const SIZE_TO_SPAN: Record<WidgetSize, { readonly w: number; readonly h: number }> = {
  sm: { w: 4, h: 3 },
  md: { w: 6, h: 4 },
  lg: { w: 8, h: 5 },
  full: { w: 12, h: 5 },
};

function vizToPanelType(viz: WidgetVizType): DashboardPanelType {
  return VIZ_TO_PANEL[viz];
}

/** Inverse of vizToPanelType; falls back to timeseries for legacy specs. */
export function panelTypeToViz(panelType: DashboardPanelType): WidgetVizType {
  const match = (Object.keys(VIZ_TO_PANEL) as WidgetVizType[]).find(
    (viz) => VIZ_TO_PANEL[viz] === panelType
  );
  return match ?? "timeseries";
}

function sizeToSpan(size: WidgetSize): { readonly w: number; readonly h: number } {
  return SIZE_TO_SPAN[size];
}

/** Resolves a saved layout's column span back to the nearest size preset. */
function spanToSize(layout: DashboardLayout): WidgetSize {
  const match = (Object.keys(SIZE_TO_SPAN) as WidgetSize[]).find(
    (size) => SIZE_TO_SPAN[size].w === layout.w
  );
  return match ?? "md";
}

export function createDefaultEditorState(): WidgetEditorState {
  return {
    title: "",
    viz: "timeseries",
    queries: [createDefaultQuery(QUERY_LABELS[0])],
    formulas: [],
    step: "5m",
    spaceAgg: "avg",
    display: { legend: true, smooth: true },
    size: "md",
  };
}

let widgetSeq = 0;
function makeWidgetId(): string {
  widgetSeq += 1;
  return `w_${Date.now().toString(36)}_${widgetSeq}`;
}

/** Serialize editor state into a create/update payload for the dashboards API. */
export function editorStateToPayload(
  state: WidgetEditorState,
  position: number,
  existingId?: string
): CreateWidgetPayload {
  const id = existingId ?? makeWidgetId();
  const span = sizeToSpan(state.size);
  const layout: DashboardLayout = { x: 0, y: 0, w: span.w, h: span.h };
  const panelType = vizToPanelType(state.viz);
  const layoutVariant = VIZ_TO_VARIANT[state.viz];
  const title = state.title.trim() || state.queries[0]?.metricName || "Untitled widget";

  const query: DashboardMetricsQuerySpec = {
    kind: "metrics",
    step: state.step,
    spaceAggregation: state.spaceAgg,
    queries: state.queries,
    formulas: state.formulas.length > 0 ? state.formulas : undefined,
  };

  const spec: DashboardPanelSpec = {
    id,
    panelType,
    layoutVariant,
    query,
    layout,
    title,
    legend: state.display.legend,
    smooth: state.display.smooth,
  };

  return { spec, position };
}

/** Rehydrate editor state from a saved metrics widget spec for re-editing. */
export function specToEditorState(spec: DashboardPanelSpec): WidgetEditorState {
  const { query } = spec;
  return {
    title: spec.title,
    viz: panelTypeToViz(spec.panelType),
    queries: query.queries,
    formulas: query.formulas ?? [],
    step: query.step,
    spaceAgg: query.spaceAggregation,
    display: { legend: spec.legend, smooth: spec.smooth },
    size: spanToSize(spec.layout),
  };
}
