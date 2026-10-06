import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";

import { PageShell } from "@shared/components/ui/layout/PageShell";

import { useMonitorDetail } from "../../hooks/useMonitorDetail";

import WizardConditionsStep from "./WizardConditionsStep";
import WizardDefineStep from "./WizardDefineStep";
import WizardFooter from "./WizardFooter";
import WizardNotifyStep from "./WizardNotifyStep";
import WizardQueryStep from "./WizardQueryStep";
import WizardTypeStep from "./WizardTypeStep";
import { monitorToDraft } from "./monitorToDraft";
import { useWizardState } from "./useWizardState";
import { useWizardSubmit } from "./useWizardSubmit";

export default function NewMonitorPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { monitorId?: string };
  const editId = params.monitorId ? Number(params.monitorId) : undefined;
  const editMode = editId !== undefined && !Number.isNaN(editId);

  const detailQ = useMonitorDetail(editMode ? editId : undefined);
  const initial = useMemo(
    () => (detailQ.data ? monitorToDraft(detailQ.data) : undefined),
    [detailQ.data]
  );

  const { draft, setDraft, setType } = useWizardState(initial);
  const { saving, error, save, testing, testResult, testError, test } = useWizardSubmit(
    editMode ? editId : undefined
  );

  const title = editMode ? "Edit monitor" : "New monitor";

  if (editMode && detailQ.isPending) {
    return (
      <PageShell>
        <div className="p-8 text-foreground-muted text-sm">Loading monitor…</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => navigate({ to: "/monitors" })}
          className="flex items-center gap-1 text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft size={12} />
          Monitors
        </button>
        <span className="text-foreground-muted">/</span>
        <span className="font-medium text-foreground">{title}</span>
      </div>

      <div>
        <h1 className="font-semibold text-2xl text-foreground">{title}</h1>
        <p className="mt-1 text-foreground-secondary text-sm">
          {editMode
            ? "Adjust this alert rule · changes apply on the next evaluation cycle."
            : "Create an alert rule · saved monitors are evaluated continuously and notify configured channels."}
        </p>
      </div>

      <WizardTypeStep value={draft.type} onChange={setType} />
      <WizardQueryStep draft={draft} setDraft={setDraft} />
      <WizardConditionsStep draft={draft} setDraft={setDraft} />
      <WizardNotifyStep draft={draft} setDraft={setDraft} />
      <WizardDefineStep draft={draft} setDraft={setDraft} />

      <WizardFooter
        evalEverySec={draft.evalEverySec}
        editMode={editMode}
        saving={saving}
        error={error}
        testing={testing}
        testResult={testResult}
        testError={testError}
        onCancel={() => navigate({ to: "/monitors" })}
        onSave={() => save(draft)}
        onTest={test}
      />
    </PageShell>
  );
}
