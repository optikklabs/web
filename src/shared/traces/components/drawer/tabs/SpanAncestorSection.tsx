import type { TraceRecord } from "@shared/api/traces/schemas";
import { DrawerSection } from "@shared/components/ui/overlay/detail-drawer/DrawerSection";
import { svcHue } from "@shared/traces/utils/color";
import { formatDuration } from "@shared/utils/formatters";
import { ChevronRight } from "lucide-react";
import { memo } from "react";

interface Props {
  readonly ancestors: readonly TraceRecord[];
  readonly onSpanClick?: (span: { spanId: string }) => void;
}

function SpanAncestorSectionComponent({ ancestors, onSpanClick }: Props) {
  if (ancestors.length === 0) return null;

  return (
    <DrawerSection title="Ancestor Path (Parent Hierarchy)">
      <div className="flex flex-col gap-1.5 rounded-md border border-border bg-secondary p-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
          {ancestors.map((anc, i) => {
            const hue = svcHue(anc.serviceName || "");
            const color = `oklch(0.62 0.14 ${hue})`;
            return (
              <div key={anc.spanId} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={12} className="text-foreground-caption" />}
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1 rounded bg-background px-2 py-1 text-[11.5px] hover:bg-muted"
                  onClick={() => onSpanClick?.({ spanId: anc.spanId })}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-foreground-muted">{anc.serviceName}</span>
                  <span className="font-mono text-foreground">{anc.operationName}</span>
                  <span className="font-mono text-[10.5px] text-foreground-caption">
                    ({formatDuration(anc.durationMs)})
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </DrawerSection>
  );
}

export const SpanAncestorSection = memo(SpanAncestorSectionComponent);
