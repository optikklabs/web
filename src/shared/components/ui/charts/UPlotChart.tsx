import { memo, useEffect, useMemo, useRef, useState } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import "./uplot.css";

import { useTheme } from "@app/store/appStore";
import { cn } from "@shared/lib/utils";

import { type ChartMarker, buildMarkerDrawHook } from "./chartMarkers";

interface UPlotChartProps {
  options: Omit<uPlot.Options, "width" | "height">;
  data: uPlot.AlignedData;
  height?: number;
  fillHeight?: boolean;
  className?: string;
  /** Pass a shared uPlot.SyncPubSub instance to synchronize cursors across charts */
  syncKey?: uPlot.SyncPubSub;

  onTimeBrush?: (startMs: number, endMs: number) => void;

  markers?: readonly ChartMarker[];
  tooltipContent?: (params: { u: uPlot; idx: number; data: uPlot.AlignedData }) => {
    title?: string;
    rows: Array<{ label: string; value: string; color?: string }>;
  } | null;
}

function isAlignedDataShapeCompatible(next: uPlot.AlignedData, prev: uPlot.AlignedData): boolean {
  return next.length === prev.length;
}

function UPlotChart({
  options,
  data,
  height = 260,
  fillHeight = false,
  className,
  syncKey,
  onTimeBrush,
  markers,
  tooltipContent,
}: UPlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<uPlot | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const dataRef = useRef(data);
  dataRef.current = data;

  const theme = useTheme();

  const [hoverState, setHoverState] = useState<{
    left: number;
    top: number;
    title?: string;
    rows: Array<{ label: string; value: string; color?: string }>;
  } | null>(null);

  const structureKey = useMemo(
    () =>
      [
        options.series.length,
        height,
        fillHeight ? 1 : 0,
        syncKey?.key ?? "",
        tooltipContent ? 1 : 0,
        onTimeBrush ? 1 : 0,
        markers?.length ?? 0,
        theme,
      ].join(":"),
    [
      options.series.length,
      height,
      fillHeight,
      syncKey,
      tooltipContent,
      onTimeBrush,
      markers,
      theme,
    ]
  );

  const mergedOptions = useMemo(() => {
    const existingHooks = options.hooks ?? {};
    const setCursorHooks = existingHooks.setCursor ?? [];
    const drawHooks = existingHooks.draw ?? [];
    const markerDraw = markers && markers.length > 0 ? [buildMarkerDrawHook(markers)] : [];

    return {
      ...options,
      width: 100,
      height: fillHeight ? Math.max(height, 180) : height,
      cursor: {
        drag: { x: true, y: false, setScale: !onTimeBrush },
        sync: syncKey ? { key: syncKey.key } : undefined,
        ...options.cursor,
      },
      hooks: {
        ...existingHooks,
        draw: [...drawHooks, ...markerDraw],
        setSelect: [
          ...(existingHooks.setSelect ?? []),
          ...(onTimeBrush
            ? [
                (u: uPlot) => {
                  const left = u.select.left;
                  const width = u.select.width;
                  if (width < 10) return;
                  const startMs = Math.round(u.posToVal(left, "x") * 1000);
                  const endMs = Math.round(u.posToVal(left + width, "x") * 1000);
                  if (startMs < endMs) onTimeBrush(startMs, endMs);

                  u.setSelect({ left: 0, width: 0, top: 0, height: 0 }, false);
                },
              ]
            : []),
        ],
        setCursor: [
          ...setCursorHooks,
          (u: uPlot) => {
            if (!tooltipContent || !containerRef.current) {
              return;
            }

            const idx = u.cursor.idx;
            if (idx == null || idx < 0) {
              setHoverState(null);
              return;
            }

            const content = tooltipContent({ u, idx, data: dataRef.current });
            if (!content || content.rows.length === 0) {
              setHoverState(null);
              return;
            }

            const containerWidth = containerRef.current.clientWidth;
            const tooltipWidth = 220;
            const rawLeft = (u.cursor.left ?? 0) + 14;
            const left = Math.min(
              Math.max(rawLeft, 12),
              Math.max(containerWidth - tooltipWidth, 12)
            );
            const top = Math.max((u.cursor.top ?? 0) + 12, 12);

            setHoverState({
              left,
              top,
              title: content.title,
              rows: content.rows,
            });
          },
        ],
      },
    };
  }, [options, height, fillHeight, tooltipContent, syncKey, onTimeBrush, markers]);

  const [dataLayoutVersion, setDataLayoutVersion] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.dataset.chartStructure = `${structureKey}:${dataLayoutVersion}`;

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    chartRef.current?.destroy();
    chartRef.current = null;

    const measuredHeight = fillHeight ? Math.max(el.clientHeight || height, 180) : height;
    const opts = { ...mergedOptions, width: el.clientWidth, height: measuredHeight };

    const u = new uPlot(opts, dataRef.current, el);
    chartRef.current = u;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0 && chartRef.current) {
          const nextHeight = fillHeight
            ? Math.max(entry.contentRect.height || height, 180)
            : height;
          chartRef.current.setSize({ width: w, height: nextHeight });
        }
      }
    });
    ro.observe(el);
    resizeObserverRef.current = ro;

    const handleMouseLeave = () => setHoverState(null);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mouseleave", handleMouseLeave);
      ro.disconnect();
      resizeObserverRef.current = null;
      chartRef.current?.destroy();
      chartRef.current = null;
      delete el.dataset.chartStructure;
    };
  }, [mergedOptions, height, fillHeight, structureKey, dataLayoutVersion]);

  useEffect(() => {
    const u = chartRef.current;
    if (!u) return;
    if (!isAlignedDataShapeCompatible(data, u.data as uPlot.AlignedData)) {
      setDataLayoutVersion((v) => v + 1);
      return;
    }
    u.setData(data, true);
  }, [data]);

  return (
    <div
      ref={containerRef}
      className={cn("uplot-shell relative w-full", fillHeight && "h-full", className)}
    >
      {hoverState ? (
        <div
          className="pointer-events-none absolute z-20 min-w-[220px] rounded-[var(--card-radius)] border border-border bg-surface-overlay px-3 py-2 shadow-[var(--shadow-md)] backdrop-blur-[10px]"
          style={{ left: hoverState.left, top: hoverState.top }}
        >
          {hoverState.title ? (
            <div className="mb-2 font-semibold text-[11px] text-foreground-secondary">
              {hoverState.title}
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            {hoverState.rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color ?? "var(--text-muted)" }}
                  />
                  <span className="truncate text-foreground-secondary">{row.label}</span>
                </div>
                <span className="shrink-0 font-mono text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default memo(UPlotChart);
