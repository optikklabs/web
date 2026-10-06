import { Select } from "@shared/components/primitives/ui/select";
import { Switch } from "@shared/components/primitives/ui/switch";

import {
  MetricSegmentedControl,
  type SegmentOption,
} from "@shared/metrics/components/MetricSegmentedControl";
import {
  CHART_TYPE_OPTIONS,
  SPACE_AGGREGATION_OPTIONS,
  TIME_STEP_OPTIONS,
} from "@shared/metrics/constants";
import type {
  ChartType,
  MetricSpaceAggregation,
  MetricYAxisScale,
  TimeStep,
} from "@shared/metrics/types";
import { useMetricsStore } from "../store/metricsStore";

interface MetricsExplorerToolbarProps {
  readonly chartType: ChartType;
  readonly step: TimeStep;
  readonly spaceAgg: MetricSpaceAggregation;
  readonly onChartTypeChange: (ct: ChartType) => void;
  readonly onStepChange: (s: TimeStep) => void;
  readonly onSpaceAggChange: (sa: MetricSpaceAggregation) => void;
}

const CHART_TYPE_SEGMENTS: ReadonlyArray<SegmentOption<ChartType>> = CHART_TYPE_OPTIONS.map(
  (o) => ({ value: o.value, label: o.label })
);

const Y_AXIS_SEGMENTS: ReadonlyArray<SegmentOption<MetricYAxisScale>> = [
  { value: "linear", label: "linear" },
  { value: "log", label: "log" },
  { value: "percent", label: "%" },
];

export function MetricsExplorerToolbar({
  chartType,
  step,
  spaceAgg,
  onChartTypeChange,
  onStepChange,
  onSpaceAggChange,
}: MetricsExplorerToolbarProps) {
  const showMarkers = useMetricsStore((s) => s.showMarkers);
  const setShowMarkers = useMetricsStore((s) => s.setShowMarkers);
  const showLegend = useMetricsStore((s) => s.showLegend);
  const setShowLegend = useMetricsStore((s) => s.setShowLegend);
  const smooth = useMetricsStore((s) => s.smooth);
  const setSmooth = useMetricsStore((s) => s.setSmooth);
  const yAxisScale = useMetricsStore((s) => s.yAxisScale);
  const setYAxisScale = useMetricsStore((s) => s.setYAxisScale);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <MetricSegmentedControl
          options={CHART_TYPE_SEGMENTS}
          value={chartType}
          onChange={onChartTypeChange}
        />
        <Switch
          label="Markers"
          checked={showMarkers}
          onChange={(e) => setShowMarkers(e.target.checked)}
        />
        <Switch
          label="Legend"
          checked={showLegend}
          onChange={(e) => setShowLegend(e.target.checked)}
        />
        <Switch label="Smooth" checked={smooth} onChange={(e) => setSmooth(e.target.checked)} />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[11px] text-foreground-muted uppercase tracking-wide">
            Step
          </span>
          <Select
            size="sm"
            value={step}
            onChange={(v) => onStepChange(v as TimeStep)}
            options={TIME_STEP_OPTIONS}
            className="w-[80px]"
          />
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[11px] text-foreground-muted uppercase tracking-wide">
            Space
          </span>
          <Select
            size="sm"
            value={spaceAgg}
            onChange={(v) => onSpaceAggChange(v as MetricSpaceAggregation)}
            options={SPACE_AGGREGATION_OPTIONS}
            className="w-[90px]"
          />
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[11px] text-foreground-muted uppercase tracking-wide">
            Y-axis
          </span>
          <MetricSegmentedControl
            options={Y_AXIS_SEGMENTS}
            value={yAxisScale}
            onChange={setYAxisScale}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
