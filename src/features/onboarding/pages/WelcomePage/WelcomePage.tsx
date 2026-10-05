import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { rotateApiKey } from "@shared/api/tenantApiKey";
import { CodeBlock, CopyButton, SnippetTabs } from "@shared/components/primitives/ui/code-block";
import { ROUTES } from "@shared/constants/routes";
import { buildQuickstartSnippets } from "@shared/instrumentation/snippets";
import { useIngestionEndpoints } from "@shared/instrumentation/useIngestionEndpoints";

import {
  clearSignupApiKey,
  stashSignupApiKey,
  takeSignupApiKey,
} from "@shared/api/auth/apiKeyHandoff";

import { LoginBrandPanel } from "@/app/auth/pages/LoginPage/LoginBrandPanel";
import { FirstDataStatus } from "./FirstDataStatus";

export function WelcomePage() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState<string | null>(() => takeSignupApiKey());
  const endpoints = useIngestionEndpoints();
  const snippets = endpoints ? buildQuickstartSnippets(endpoints, apiKey) : [];
  const [activeTab, setActiveTab] = useState("env");

  const active = snippets.find((s) => s.id === activeTab) ?? snippets[0];

  const finishOnboarding = () => {
    clearSignupApiKey();
    navigate({ to: ROUTES.overview });
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-surface-canvas text-foreground lg:grid-cols-[1.05fr_1fr]">
      <LoginBrandPanel />
      <main className="grid grid-rows-[1fr_auto] px-12 py-7 max-md:px-6 max-md:py-5">
        <div className="mx-auto w-full max-w-[440px] self-center py-7">
          <header className="mb-5">
            <h2 className="m-0 mb-1.5 font-bold text-2xl tracking-[-0.015em]">
              You&apos;re in. Send your first trace.
            </h2>
            <p className="m-0 text-[13.5px] text-foreground-muted">
              Point your OpenTelemetry SDK or collector at Optikk with the credentials below.
            </p>
          </header>

          <CredentialRow label="OTLP endpoint (gRPC)" value={endpoints?.grpc ?? null} icon={null} />
          <CredentialRow label="OTLP endpoint (HTTP)" value={endpoints?.http ?? null} icon={null} />
          <CredentialRow
            label="API key"
            value={apiKey}
            icon={<KeyRound size={14} strokeWidth={2} />}
            action={<GenerateKeyButton onGenerated={setApiKey} />}
          />
          {apiKey && (
            <p className="m-0 mb-3 text-[11.5px] text-foreground-muted">
              Store this key now — it cannot be shown again. If lost, regenerate it in Settings.
            </p>
          )}

          <SnippetTabs
            tabs={snippets.map((s) => ({ id: s.id, label: s.label }))}
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
          <CodeBlock code={active?.code ?? ""} />

          <FirstDataStatus endpoints={endpoints} />

          <button
            type="button"
            onClick={finishOnboarding}
            className="mt-5 flex h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-primary bg-primary font-semibold text-[var(--login-submit-fg)] text-sm transition-colors hover:border-[var(--login-link)] hover:bg-[var(--login-link)]"
          >
            Go to dashboard
            <ArrowRight size={14} strokeWidth={2.2} />
          </button>
        </div>
        <footer className="text-center font-mono text-[11px] text-foreground-muted">
          Your trial is active — no card required.
        </footer>
      </main>
    </div>
  );
}

function GenerateKeyButton({
  onGenerated,
}: {
  readonly onGenerated: (key: string) => void;
}) {
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const resp = await rotateApiKey();
      stashSignupApiKey(resp.apiKey);
      onGenerated(resp.apiKey);
    } catch {
      toast.error("Unable to generate an API key");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generate}
      disabled={generating}
      className="shrink-0 cursor-pointer rounded border border-border bg-surface-inset px-2 py-1 font-semibold text-[11px] text-foreground-secondary uppercase tracking-[0.04em] transition-colors hover:border-foreground-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
    >
      {generating ? "Generating…" : "Generate API key"}
    </button>
  );
}

function CredentialRow({
  label,
  value,
  icon,
  action,
}: {
  readonly label: string;
  readonly value: string | null;
  readonly icon: React.ReactNode;
  readonly action?: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <span className="font-semibold text-[11.5px] text-foreground-secondary uppercase tracking-[0.04em]">
        {label}
      </span>
      <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        {icon}
        <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-foreground">
          {value ?? "—"}
        </code>
        {value != null ? <CopyButton text={value} /> : action}
      </div>
    </div>
  );
}
