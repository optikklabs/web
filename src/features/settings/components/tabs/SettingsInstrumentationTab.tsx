import { Card as Surface } from "@shared/components/primitives/ui/card";
import { CodeBlock, CopyButton } from "@shared/components/primitives/ui/code-block";
import {
  type LanguageGuide,
  buildCollectorSnippets,
  buildLanguageGuides,
} from "@shared/instrumentation/guides";
import { useIngestionEndpoints } from "@shared/instrumentation/useIngestionEndpoints";
import { Boxes, KeyRound, Terminal } from "lucide-react";
import { useMemo, useState } from "react";

export default function SettingsInstrumentationTab(): JSX.Element {
  const endpoints = useIngestionEndpoints();
  const guides = useMemo(() => (endpoints ? buildLanguageGuides(endpoints) : []), [endpoints]);
  const collector = endpoints ? buildCollectorSnippets(endpoints) : [];

  const [activeLang, setActiveLang] = useState<LanguageGuide["id"]>(guides[0]?.id ?? "java");
  const active = guides.find((g) => g.id === activeLang) ?? guides[0];

  return (
    <Surface elevation={1} padding="lg" className="settings-card max-w-3xl">
      <div className="mb-md flex items-center gap-sm">
        <Terminal size={20} />
        <h3 className="m-0 font-semibold text-lg">Instrumentation</h3>
      </div>
      <p className="m-0 mb-md text-muted text-xs">
        Send telemetry from your services to Optikk with OpenTelemetry. Pick a language below, or
        run a shared Collector in Kubernetes.
      </p>

      <div className="border-t" />

      <div className="grid gap-md py-md sm:grid-cols-2">
        <CredentialRow label="OTLP endpoint (gRPC)" value={endpoints?.grpc ?? null} icon={null} />
        <CredentialRow label="OTLP endpoint (HTTP)" value={endpoints?.http ?? null} icon={null} />
        <CredentialRow
          label="API key"
          value={null}
          icon={<KeyRound size={14} strokeWidth={2} />}
          fallback="Generate in Settings → Tenant (keys are shown once)"
        />
      </div>

      <div className="flex flex-wrap gap-1 border-border border-b">
        {guides.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActiveLang(g.id)}
            className={
              activeLang === g.id
                ? "border-primary border-b-2 px-3 py-1.5 font-semibold text-[13px] text-foreground"
                : "border-transparent border-b-2 px-3 py-1.5 text-[13px] text-foreground-muted hover:text-foreground-secondary"
            }
          >
            {g.label}
          </button>
        ))}
      </div>

      {active && (
        <div className="pt-md">
          <p className="m-0 mb-sm text-secondary text-xs">{active.summary}</p>
          {active.steps.map((step) => (
            <div key={step.title} className="mb-md">
              <span className="font-semibold text-md">{step.title}</span>
              {step.description && (
                <p className="m-0 mt-0.5 mb-1 text-muted text-xs">{step.description}</p>
              )}
              <CodeBlock code={step.code} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-lg border-t pt-md">
        <div className="mb-xs flex items-center gap-xs">
          <Boxes size={16} className="text-muted" />
          <span className="font-semibold text-md">OTel Collector on Kubernetes</span>
        </div>
        <p className="m-0 mb-sm text-muted text-xs">
          Run one Collector in-cluster that holds the API key and forwards all services' telemetry
          to Optikk. Your apps export to the Collector Service instead of directly to Optikk.
        </p>
        {collector.map((snippet) => (
          <div key={snippet.title} className="mb-md">
            <span className="font-semibold text-md">{snippet.title}</span>
            {snippet.description && (
              <p className="m-0 mt-0.5 mb-1 text-muted text-xs">{snippet.description}</p>
            )}
            <CodeBlock code={snippet.code} />
          </div>
        ))}
      </div>
    </Surface>
  );
}

function CredentialRow({
  label,
  value,
  icon,
  fallback,
}: {
  readonly label: string;
  readonly value: string | null;
  readonly icon: React.ReactNode;
  readonly fallback?: string;
}) {
  return (
    <div>
      <span className="font-semibold text-[11.5px] text-secondary uppercase tracking-[0.04em]">
        {label}
      </span>
      <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        {icon}
        {value ? (
          <code className="min-w-0 flex-1 truncate bg-transparent p-0 font-mono text-[12.5px] text-foreground">
            {value}
          </code>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[12px] text-muted italic">
            {fallback ?? "—"}
          </span>
        )}
        {value != null && <CopyButton text={value} />}
      </div>
    </div>
  );
}
