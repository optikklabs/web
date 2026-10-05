import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { type CreateMonitorPayload, createMonitor, testMonitor } from "../../api/monitorsApi";
import { useUpdateMonitor } from "../../hooks/useMonitorMutations";

export interface TestResult {
  readonly value: number;
  readonly hasData: boolean;
  readonly wouldDecideAs: string;
  readonly threshold: number;
}

import { getErrorMessage } from "@shared/utils/errorUtils";

// Drives the wizard footer: save (create or update) + test. `editId` switches
// the surface into edit mode; testing requires a saved monitor id.
export function useWizardSubmit(editId: number | undefined) {
  const navigate = useNavigate();
  const updateMutation = useUpdateMonitor(editId ?? -1);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const save = async (draft: CreateMonitorPayload) => {
    setSaving(true);
    setError(null);
    try {
      if (editId !== undefined) {
        const updated = await updateMutation.mutateAsync(draft);
        navigate({ to: `/monitors/${updated.id}` as string & {} });
      } else {
        const created = await createMonitor(draft);
        navigate({ to: `/monitors/${created.id}` as string & {} });
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save monitor"));
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    if (editId === undefined) return;
    setTesting(true);
    setTestError(null);
    setTestResult(null);
    try {
      setTestResult(await testMonitor(editId));
    } catch (err) {
      setTestError(getErrorMessage(err, "Failed to test monitor"));
    } finally {
      setTesting(false);
    }
  };

  return { saving, error, save, testing, testResult, testError, test };
}
