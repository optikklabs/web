import { useParams } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@shared/components/primitives/ui/button";
import { Card } from "@shared/components/primitives/ui/card";
import EmptyState from "@shared/components/ui/feedback/EmptyState";
import Loading from "@shared/components/ui/feedback/Loading";
import { PageShell } from "@shared/components/ui/layout/PageShell";

import { formatRelativeTime } from "@shared/utils/formatters";
import { LlmBackLink } from "../../components/LlmBackLink";
import { usePrompt, usePromptMutations } from "../../hooks/usePrompts";

function templateText(template: unknown): string {
  if (typeof template === "string") return template;
  try {
    return JSON.stringify(template, null, 2);
  } catch {
    return String(template);
  }
}

export default function PromptDetailPage() {
  const { name } = useParams({ strict: false });
  const promptQ = usePrompt(name ?? null);
  const { setStatus, addVersion } = usePromptMutations(name);
  const [selected, setSelected] = useState<number | null>(null);
  const p = promptQ.data;

  const versions = p?.versions ?? [];
  const active = versions.find((v) => v.version === selected) ?? versions[0];

  return (
    <PageShell>
      <LlmBackLink tab="prompts" />

      {promptQ.isPending ? (
        <Loading />
      ) : !p ? (
        <EmptyState title="Prompt not found" />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[240px_1fr]">
          <Card className="flex flex-col gap-1 p-2">
            <div className="px-2 py-1 font-semibold text-foreground text-sm">{p.name}</div>
            {versions.map((v) => (
              <button
                type="button"
                key={v.version}
                onClick={() => setSelected(v.version)}
                className={`flex items-center justify-between rounded px-2 py-1.5 text-left text-[12px] hover:bg-surface ${
                  active?.version === v.version ? "bg-surface" : ""
                }`}
              >
                <span className="text-foreground">v{v.version}</span>
                {v.status === "production" ? (
                  <span className="rounded bg-[var(--ok-soft)] px-1.5 py-0.5 text-[9px] text-[var(--ok-fg)]">
                    prod
                  </span>
                ) : (
                  <span className="text-[10px] text-foreground-muted">{v.status}</span>
                )}
              </button>
            ))}
          </Card>

          <Card className="flex flex-col gap-3 p-4">
            {active ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">
                      Version {active.version}
                    </span>
                    <span className="text-[11px] text-foreground-muted">{active.status}</span>
                  </div>
                  <div className="flex gap-2">
                    {active.status !== "production" && (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setStatus.mutate({ version: active.version, status: "production" })
                        }
                      >
                        Promote
                      </Button>
                    )}
                    <Button
                      onClick={() =>
                        addVersion.mutate({
                          template: active.template,
                          production: false,
                          notes: "cloned",
                        })
                      }
                    >
                      New version
                    </Button>
                  </div>
                </div>
                {active.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {active.variables.map((v) => (
                      <span
                        key={v}
                        className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-foreground-secondary"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded border border-border bg-surface p-3 font-mono text-[12px] text-foreground-secondary">
                  {templateText(active.template)}
                </pre>
                {active.notes && (
                  <p className="text-[11px] text-foreground-muted">{active.notes}</p>
                )}
                <span className="text-[10px] text-foreground-muted">
                  created {formatRelativeTime(active.createdAt)}
                </span>
              </>
            ) : (
              <p className="text-[12px] text-foreground-muted">No versions.</p>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}
