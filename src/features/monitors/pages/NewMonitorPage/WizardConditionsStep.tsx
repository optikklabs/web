import type { CreateMonitorPayload, MonitorConditions } from "../../api/monitorsApi";

import StepShell from "./StepShell";
import FieldRow from "./queryForms/FieldRow";

interface Props {
  readonly draft: CreateMonitorPayload;
  readonly setDraft: (fn: (prev: CreateMonitorPayload) => CreateMonitorPayload) => void;
}

const COMPARATORS: { id: MonitorConditions["comparator"]; label: string }[] = [
  { id: "above", label: "above" },
  { id: "below", label: "below" },
  { id: "equal", label: "equal to" },
];

const NO_DATA_AS: { id: MonitorConditions["noDataAs"]; label: string }[] = [
  { id: "no_data", label: "no-data" },
  { id: "alert", label: "alert" },
  { id: "ok", label: "ok" },
];

function NumericInput({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <input
      type="number"
      step="any"
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? undefined : Number(v));
      }}
      className="w-32 rounded border border-border bg-card px-2.5 py-1.5 font-mono text-xs"
    />
  );
}

export default function WizardConditionsStep({ draft, setDraft }: Props) {
  const c = draft.conditions;

  const update = (patch: Partial<MonitorConditions>) =>
    setDraft((prev) => ({ ...prev, conditions: { ...prev.conditions, ...patch } }));

  return (
    <StepShell n={3} title="Set alert conditions" sub="When should this monitor fire?">
      <FieldRow label="Trigger when">
        <div className="flex items-center gap-2">
          <span className="text-xs">value is</span>
          <div className="flex items-center gap-1">
            {COMPARATORS.map((cmp) => {
              const active = c.comparator === cmp.id;
              return (
                <button
                  key={cmp.id}
                  type="button"
                  onClick={() => update({ comparator: cmp.id })}
                  className={`rounded px-2 py-0.5 text-xs ${
                    active ? "bg-primary text-white" : "bg-secondary text-foreground-secondary"
                  }`}
                >
                  {cmp.label}
                </button>
              );
            })}
          </div>
          <span className="text-xs">the threshold</span>
        </div>
      </FieldRow>
      <FieldRow label="Alert threshold">
        <div className="flex items-center gap-2">
          <NumericInput value={c.alertThreshold} onChange={(v) => update({ alertThreshold: v })} />
          <span className="rounded bg-error-subtle px-1.5 py-0.5 text-[10px] text-error">
            critical
          </span>
        </div>
      </FieldRow>
      <FieldRow label="Warn threshold">
        <div className="flex items-center gap-2">
          <NumericInput value={c.warnThreshold} onChange={(v) => update({ warnThreshold: v })} />
          <span className="rounded bg-warning-subtle px-1.5 py-0.5 text-[10px] text-warning">
            warn
          </span>
        </div>
      </FieldRow>
      <FieldRow label="Recovery threshold">
        <NumericInput
          value={c.recoveryThreshold}
          onChange={(v) => update({ recoveryThreshold: v })}
        />
      </FieldRow>
      <FieldRow label="No data after">
        <div className="flex items-center gap-2">
          <NumericInput
            value={c.noDataAfterSec}
            onChange={(v) => update({ noDataAfterSec: v ?? 0 })}
          />
          <span className="text-foreground-muted text-xs">seconds · treat as</span>
          <div className="flex items-center gap-1">
            {NO_DATA_AS.map((opt) => {
              const active = c.noDataAs === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update({ noDataAs: opt.id })}
                  className={`rounded px-2 py-0.5 text-xs ${
                    active ? "bg-primary text-white" : "bg-secondary text-foreground-secondary"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </FieldRow>
    </StepShell>
  );
}
