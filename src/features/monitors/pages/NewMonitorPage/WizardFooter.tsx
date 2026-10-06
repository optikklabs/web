import { Check, FlaskConical } from "lucide-react";

import type { MonitorTestResult } from "../../api/monitorsApi";

interface Props {
  readonly evalEverySec: number;
  readonly editMode: boolean;
  readonly saving: boolean;
  readonly error: string | null;
  readonly testing: boolean;
  readonly testResult: MonitorTestResult | null;
  readonly testError: string | null;
  readonly onCancel: () => void;
  readonly onSave: () => void;
  readonly onTest: () => void;
}

function TestReadout({ result }: { readonly result: MonitorTestResult }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px]">
      <span className="font-mono text-foreground-secondary">
        value <span className="text-foreground">{result.value}</span>
      </span>
      <span className="font-mono text-foreground-secondary">
        threshold <span className="text-foreground">{result.threshold}</span>
      </span>
      <span className="font-mono text-foreground-secondary">
        has data <span className="text-foreground">{result.hasData ? "yes" : "no"}</span>
      </span>
      <span
        className={`rounded px-1.5 py-0.5 font-medium text-[10px] ${
          result.wouldDecideAs === "alert"
            ? "bg-error-subtle text-error"
            : result.wouldDecideAs === "warn"
              ? "bg-warning-subtle text-warning"
              : "bg-success-subtle text-success"
        }`}
      >
        would decide: {result.wouldDecideAs}
      </span>
    </div>
  );
}

export default function WizardFooter({
  evalEverySec,
  editMode,
  saving,
  error,
  testing,
  testResult,
  testError,
  onCancel,
  onSave,
  onTest,
}: Props) {
  return (
    <div className="-mx-6 -mb-10 sticky bottom-0 mt-4 flex flex-col gap-2 border-border border-t bg-card px-6 py-3">
      {(testResult || testError) && (
        <div>
          {testResult && <TestReadout result={testResult} />}
          {testError && <div className="text-[11px] text-error">{testError}</div>}
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="text-foreground-muted text-xs">
          Monitor will be evaluated every <span className="font-mono">{evalEverySec}s</span>
        </div>
        {error && <div className="text-error text-xs">{error}</div>}
        <div className="ml-auto flex items-center gap-2">
          {editMode && (
            <button
              type="button"
              disabled={testing}
              onClick={onTest}
              className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary disabled:opacity-60"
            >
              <FlaskConical size={13} />
              {testing ? "Testing…" : "Test on existing data"}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-border bg-card px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 font-medium text-sm text-white hover:bg-primary disabled:opacity-60"
          >
            <Check size={13} />
            {saving ? "Saving…" : editMode ? "Save changes" : "Save monitor"}
          </button>
        </div>
      </div>
    </div>
  );
}
