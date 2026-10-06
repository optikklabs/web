import { useParams } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@shared/components/primitives/ui/button";
import { Card } from "@shared/components/primitives/ui/card";
import { Modal } from "@shared/components/primitives/ui/dialog";
import EmptyState from "@shared/components/ui/feedback/EmptyState";
import Loading from "@shared/components/ui/feedback/Loading";
import { PageShell } from "@shared/components/ui/layout/PageShell";
import { formatDuration, formatNumber } from "@shared/utils/formatters";

import { LlmBackLink } from "../../components/LlmBackLink";
import { Field, SelectInput, TextInput } from "../../components/form";
import { useDataset, useDatasetMutations } from "../../hooks/useDatasets";
import { formatCost } from "../../utils/llmFormat";

function preview(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function DatasetDetailPage() {
  const { datasetId } = useParams({ strict: false });
  const id = Number(datasetId);
  const datasetQ = useDataset(Number.isFinite(id) ? id : null);
  const { run } = useDatasetMutations(id);
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");

  const d = datasetQ.data;

  const startRun = () => {
    run.mutate({ provider, model }, { onSuccess: () => setOpen(false) });
  };

  return (
    <PageShell>
      <LlmBackLink tab="datasets" />

      {datasetQ.isPending ? (
        <Loading />
      ) : !d ? (
        <EmptyState title="Dataset not found" />
      ) : (
        <div className="flex flex-col gap-3">
          <Card className="flex items-center justify-between p-4">
            <div>
              <div className="font-semibold text-foreground">{d.name}</div>
              <div className="mt-1 text-[11px] text-foreground-muted">
                {d.description || "No description"}
              </div>
              <div className="mt-2 flex gap-4 font-mono text-[11px] text-foreground-secondary">
                <span>{formatNumber(d.itemCount)} items</span>
                <span>{formatNumber(d.runCount)} runs</span>
              </div>
            </div>
            <Button onClick={() => setOpen(true)} disabled={d.itemCount === 0}>
              Run experiment
            </Button>
          </Card>

          <section>
            <h3 className="mb-2 font-semibold text-foreground text-sm">Runs</h3>
            {d.runs.length === 0 ? (
              <p className="text-[12px] text-foreground-muted">No runs yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {d.runs.map((r) => (
                  <Card key={r.id} className="flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <div className="truncate text-[12px] text-foreground">{r.name}</div>
                      <div className="font-mono text-[10px] text-foreground-muted">
                        {r.provider} · {r.model} · {r.status}
                      </div>
                    </div>
                    <div className="flex gap-4 font-mono text-[11px] text-foreground-secondary">
                      {Object.entries(r.avgScores).map(([k, v]) => (
                        <span key={k}>
                          {k}: {v.toFixed(2)}
                        </span>
                      ))}
                      <span>{formatDuration(r.avgLatencyMs)}</span>
                      <span>{formatCost(r.totalCostUsd)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-foreground text-sm">Items</h3>
            <div className="flex flex-col gap-1">
              {d.items.slice(0, 50).map((it) => (
                <div
                  key={it.id}
                  className="grid grid-cols-2 gap-3 rounded border border-border bg-surface px-3 py-1.5 font-mono text-[11px]"
                >
                  <span className="truncate text-foreground-secondary">{preview(it.input)}</span>
                  <span className="truncate text-foreground-muted">
                    {preview(it.expectedOutput)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Run experiment">
        <div className="flex w-[420px] max-w-full flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Provider">
              <SelectInput value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="mistral">Mistral</option>
              </SelectInput>
            </Field>
            <Field label="Model">
              <TextInput value={model} onChange={(e) => setModel(e.target.value)} />
            </Field>
          </div>
          <p className="text-[11px] text-foreground-muted">
            Runs in the background over up to 50 items using exact-match scoring.
          </p>
          {run.isError && <p className="text-[11px] text-error">{run.error.message}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={startRun} disabled={run.isPending}>
              {run.isPending ? "Starting…" : "Start run"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
