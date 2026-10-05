import type { TraceRecord } from "@shared/api/traces/schemas";
import { cn } from "@shared/lib/utils";
import { formatDuration } from "@shared/utils/formatters";
import { memo } from "react";
import { svcHue } from "../../utils/color";

interface ServiceStat {
  readonly name: string;
  readonly count: number;
  readonly totalMs: number;
  readonly selfMs: number;
  readonly hasError: boolean;
  readonly hue: number;
}

interface Props {
  readonly spans: readonly TraceRecord[];
  readonly activeService: string | null;
  readonly onActiveServiceChange: (service: string | null) => void;
}

/** Per-service span totals, heaviest first, plus the summed trace time (at least 1ms). */
function serviceStats(spans: readonly TraceRecord[]): { list: ServiceStat[]; traceTotal: number } {
  const map = new Map<string, { count: number; totalMs: number; hasError: boolean }>();
  let traceTotal = 0;
  for (const s of spans) {
    const name = s.serviceName || "unknown";
    const dur = s.durationMs ?? 0;
    traceTotal += dur;
    const isErr = (s.status ?? "").toUpperCase() === "ERROR";
    const cur = map.get(name);
    if (cur) {
      cur.count += 1;
      cur.totalMs += dur;
      if (isErr) cur.hasError = true;
    } else {
      map.set(name, { count: 1, totalMs: dur, hasError: isErr });
    }
  }

  const list: ServiceStat[] = [];
  for (const [name, st] of map.entries()) {
    list.push({
      name,
      count: st.count,
      totalMs: st.totalMs,
      selfMs: st.totalMs,
      hasError: st.hasError,
      hue: svcHue(name),
    });
  }
  list.sort((a, b) => b.totalMs - a.totalMs);
  return { list, traceTotal: Math.max(1, traceTotal) };
}

function ServiceStripComponent({ spans, activeService, onActiveServiceChange }: Props) {
  const stats = serviceStats(spans);

  if (stats.list.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 border-border border-b bg-background px-4 py-2 text-[12px]">
      <span className="text-foreground-caption">Services ({stats.list.length}):</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={cn(
            "cursor-pointer rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-foreground-muted hover:bg-muted hover:text-foreground",
            activeService === null && "border-primary bg-primary/10 font-medium text-primary"
          )}
          onClick={() => onActiveServiceChange(null)}
        >
          All
        </button>

        {stats.list.map((s) => {
          const isActive = activeService === s.name;
          const color = `oklch(0.62 0.14 ${s.hue})`;
          return (
            <button
              key={s.name}
              type="button"
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11.5px] hover:bg-muted",
                isActive && "border-primary bg-primary/15 font-medium text-foreground",
                s.hasError && "border-error/40"
              )}
              onClick={() => onActiveServiceChange(isActive ? null : s.name)}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-foreground">{s.name}</span>
              <span className="font-mono text-[10.5px] text-foreground-caption">
                {s.count} · {formatDuration(s.totalMs)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const ServiceStrip = memo(ServiceStripComponent);
