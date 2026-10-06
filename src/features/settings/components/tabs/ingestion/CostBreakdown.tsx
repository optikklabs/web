import { PanelCard } from "@shared/components/ui/PanelCard";

import type { CostLine, IngestionCost } from "@shared/api/ingestion";
import { fmtMoney } from "./format";

interface Props {
  readonly cost: IngestionCost | undefined;
}

// Quantity reads in its own unit: GB or millions of metric samples.
function fmtQuantity(line: CostLine): string {
  if (line.unit === "GB") return `${line.quantity.toFixed(2)} GB`;
  if (line.unit === "million samples") {
    return `${line.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}M samples`;
  }
  return `${line.quantity.toLocaleString()} ${line.unit}`;
}

// Usage-based cost estimate for the current billing month.
export function CostBreakdown({ cost }: Props) {
  const currency = cost?.currency ?? "USD";
  return (
    <PanelCard title="Estimated cost" subtitle="usage-based · current billing month">
      <div className="flex flex-col gap-3">
        {(cost?.lines ?? []).map((line) => (
          <div key={line.category} className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="font-medium text-[13px] text-foreground">{line.category}</div>
              <div className="mono text-[12px] text-foreground-muted">
                {fmtQuantity(line)} · {fmtMoney(currency, line.rate)}/{line.unit}
              </div>
            </div>
            <div className="mono font-semibold text-[13px] text-foreground">
              {fmtMoney(currency, line.cost)}
            </div>
          </div>
        ))}
      </div>

      <div className="my-4 h-px bg-border" />

      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-foreground-muted">Cost so far</span>
        <span className="mono font-semibold text-[13px] text-foreground">
          {fmtMoney(currency, cost?.currentCost)}
        </span>
      </div>
      <p className="mt-3 text-[11.5px] text-foreground-muted leading-relaxed">
        Logs and traces bill per GB ingested; metrics bill at $0.10 per million samples. Estimate
        only — final invoice may vary.
      </p>
    </PanelCard>
  );
}
