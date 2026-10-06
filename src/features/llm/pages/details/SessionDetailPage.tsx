import { useNavigate, useParams } from "@tanstack/react-router";

import { Card } from "@shared/components/primitives/ui/card";
import EmptyState from "@shared/components/ui/feedback/EmptyState";
import Loading from "@shared/components/ui/feedback/Loading";
import { PageShell } from "@shared/components/ui/layout/PageShell";
import { formatDuration } from "@shared/utils/formatters";

import { LlmBackLink } from "../../components/LlmBackLink";
import { useSessionDetail } from "../../hooks/useSessions";
import { formatCost } from "../../utils/llmFormat";

export default function SessionDetailPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams({ strict: false });
  const detailQ = useSessionDetail(sessionId ?? null);
  const d = detailQ.data;

  return (
    <PageShell>
      <LlmBackLink tab="sessions" />

      {detailQ.isPending ? (
        <Loading />
      ) : !d || d.turns.length === 0 ? (
        <EmptyState title="Session not found" description="No turns recorded for this session." />
      ) : (
        <div className="flex flex-col gap-3">
          <Card className="p-4">
            <div className="font-mono text-[12px] text-foreground">{d.sessionId}</div>
            <div className="mt-1 font-mono text-[11px] text-foreground-muted">
              {d.service}
              {d.userId ? ` · user ${d.userId}` : ""}
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            {d.turns.map((t) => (
              <div key={t.traceId} className="flex flex-col gap-2">
                {t.userText && (
                  <div className="flex justify-end">
                    <div className="max-w-[75%] rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-foreground">
                      {t.userText}
                    </div>
                  </div>
                )}
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        to: `/llm/traces/${encodeURIComponent(t.traceId)}` as string & {},
                      })
                    }
                    className="max-w-[75%] rounded-lg border border-border bg-secondary px-3 py-2 text-left text-[13px] text-foreground-secondary hover:border-primary"
                  >
                    <div className="whitespace-pre-wrap">{t.outputText || "—"}</div>
                    <div className="mt-1.5 flex gap-3 font-mono text-[10px] text-foreground-muted">
                      <span>{t.model}</span>
                      <span>{formatDuration(t.durationMs)}</span>
                      <span>{formatCost(t.cost)}</span>
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
