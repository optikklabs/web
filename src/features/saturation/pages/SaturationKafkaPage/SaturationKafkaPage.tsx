import { PageShell } from "@shared/components/ui/layout/PageShell";
import { AlertTriangle, Waves } from "lucide-react";
import { useState } from "react";

import { SaturationSubnav } from "@/features/saturation/components/SaturationSubnav";

import { KafkaServiceOverview } from "./components/KafkaServiceOverview";
import { KafkaServiceSelect } from "./components/KafkaServiceSelect";
import { KafkaPageHeader } from "./header/KafkaPageHeader";
import { useKafkaClients } from "./hooks/useKafkaClients";
import { useKafkaSummary } from "./hooks/useKafkaSummary";
import { useKafkaTopology } from "./hooks/useKafkaTopology";
import { kafkaEmptyStateCopy, resolveKafkaService } from "./kafkaPageModel";

function KafkaPageSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="h-14 rounded-lg border border-border bg-card" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-20 rounded-lg border border-border bg-card" />
        ))}
      </div>
      <div className="h-[360px] rounded-lg border border-border bg-card" />
    </div>
  );
}

function KafkaErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-lg border border-[color-mix(in_oklch,var(--color-error),transparent_65%)] bg-error-subtle px-4 py-3 text-[12px] text-error"
      role="alert"
    >
      <span className="flex items-center gap-2">
        <AlertTriangle size={15} />
        {message}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 font-medium text-primary hover:underline"
      >
        Retry
      </button>
    </div>
  );
}

function KafkaEmptyState({ copy }: { copy: ReturnType<typeof kafkaEmptyStateCopy> }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-lg border border-border bg-card px-6 text-center">
      <div>
        <Waves size={28} className="mx-auto text-foreground-muted" />
        <h2 className="mt-3 font-semibold text-[14px] text-foreground">{copy.title}</h2>
        <p className="mt-1 text-[12px] text-foreground-muted">{copy.description}</p>
      </div>
    </div>
  );
}

export default function SaturationKafkaPage() {
  const clientsQ = useKafkaClients();
  const summaryQ = useKafkaSummary();
  const [requestedService, setRequestedService] = useState<string | null>(null);
  const services = clientsQ.data ?? [];
  const selectedService = resolveKafkaService(services, requestedService);
  const topologyQ = useKafkaTopology(selectedService);
  const emptyStateCopy = kafkaEmptyStateCopy(summaryQ.data);

  return (
    <PageShell>
      <div className="flex flex-col gap-4">
        <KafkaPageHeader
          summary={summaryQ.data}
          isLoading={summaryQ.isPending}
          isError={summaryQ.isError}
        />
        <SaturationSubnav active="kafka" counts={{ kafka: summaryQ.data?.topicCount }} />

        {clientsQ.isPending ? <KafkaPageSkeleton /> : null}

        {clientsQ.isError && !clientsQ.data ? (
          <KafkaErrorState
            message={`Could not load Kafka services: ${clientsQ.error.message}`}
            onRetry={() => void clientsQ.refetch()}
          />
        ) : null}

        {!clientsQ.isPending && !clientsQ.isError && services.length === 0 ? (
          <KafkaEmptyState copy={emptyStateCopy} />
        ) : null}

        {selectedService ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
              <KafkaServiceSelect
                services={services}
                value={selectedService}
                onChange={setRequestedService}
              />
              {clientsQ.isFetching || topologyQ.isFetching ? (
                <span className="text-[11px] text-foreground-muted">Refreshing…</span>
              ) : null}
            </div>

            {topologyQ.isPending ? <KafkaPageSkeleton /> : null}

            {topologyQ.isError ? (
              <KafkaErrorState
                message={`Could not load Kafka data for ${selectedService}: ${topologyQ.error.message}`}
                onRetry={() => void topologyQ.refetch()}
              />
            ) : null}

            {topologyQ.data && !topologyQ.isError ? (
              <KafkaServiceOverview
                service={selectedService}
                topology={topologyQ.data}
                onSelectService={setRequestedService}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
