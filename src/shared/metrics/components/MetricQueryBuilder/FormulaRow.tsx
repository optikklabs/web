import { Calculator, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@shared/lib/utils";

import { validateFormulaExpression } from "@shared/metrics/utils/formulaEvaluator";

interface FormulaRowProps {
  readonly id: string;
  readonly expression: string;
  readonly activeQueryIds: string[];
  readonly onExpressionChange: (expression: string) => void;
  readonly onRemove: () => void;
}

const FORMULA_COLOR = "#f59e0b";

export function FormulaRow({
  expression,
  activeQueryIds,
  onExpressionChange,
  onRemove,
}: FormulaRowProps) {
  const [focused, setFocused] = useState(false);
  // While editing, the input is driven by a local draft so typing stays
  // responsive even when the parent persists the expression asynchronously
  // (e.g. into router search params).
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? expression;
  const error = validateFormulaExpression(value, activeQueryIds);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
    onExpressionChange(e.target.value);
  };

  return (
    <div
      className={cn(
        "flex min-h-[48px] items-center gap-2 rounded-xl border px-3 py-2",
        "transition-colors duration-150",
        focused
          ? "border-[color-mix(in_oklch,var(--color-warning),transparent_65%)] bg-warning-subtle"
          : "border-border bg-secondary hover:border-border"
      )}
    >
      {}
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-semibold text-[11px] text-white"
        style={{ backgroundColor: FORMULA_COLOR }}
      >
        <Calculator size={12} />
      </div>

      {}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="shrink-0 font-semibold text-[11px] text-foreground-muted uppercase tracking-wide">
            Formula
          </span>
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              setDraft(null);
            }}
            placeholder="e.g. a / b * 100"
            className={cn(
              "h-7 flex-1 rounded-md border bg-muted px-2",
              "font-mono text-[12px] text-foreground",
              "outline-none placeholder:text-foreground-muted",
              "transition-colors duration-150",
              error
                ? "border-[color-mix(in_oklch,var(--color-error),transparent_65%)]"
                : "border-border focus:border-[color-mix(in_oklch,var(--color-warning),transparent_65%)]"
            )}
          />
        </div>
        {error && <span className="pl-[52px] text-[10px] text-error">{error}</span>}
      </div>

      {}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-md p-1 opacity-50 transition-all duration-100 hover:bg-accent hover:opacity-100"
      >
        <X size={14} className="text-foreground-muted" />
      </button>
    </div>
  );
}
