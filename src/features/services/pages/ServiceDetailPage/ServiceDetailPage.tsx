import { PageShell, PageSurface } from "@shared/components/ui/layout/PageShell";

import { ServiceHeroHeader } from "./hero/ServiceHeroHeader";
import { useServiceHeroData } from "./hooks/useServiceHeroData";
import { ServiceKpiStrip } from "./kpi/ServiceKpiStrip";
import { ServiceTabContent } from "./sections/ServiceTabContent";
import { ServiceDetailTabs } from "./tabs/ServiceDetailTabs";
import { useActiveServiceTab } from "./tabs/useActiveServiceTab";
import { useServiceDetailIdentity } from "./useServiceDetailIdentity";

function InvalidIdentity() {
  return (
    <PageShell>
      <PageSurface padding="lg">
        <div className="text-[13px] text-foreground-muted">
          This URL does not contain a service name.
        </div>
      </PageSurface>
    </PageShell>
  );
}

function ServiceDetailBody({ serviceName }: { serviceName: string }) {
  const hero = useServiceHeroData(serviceName);
  const { tab, setTab } = useActiveServiceTab();
  return (
    <div className="flex flex-col gap-4">
      <ServiceHeroHeader serviceName={serviceName} hero={hero} />
      <ServiceKpiStrip summary={hero.summary} />
      <ServiceDetailTabs active={tab} onChange={setTab} />
      <ServiceTabContent tab={tab} serviceName={serviceName} />
    </div>
  );
}

export default function ServiceDetailPage() {
  const identity = useServiceDetailIdentity();
  if (!identity.isValid) return <InvalidIdentity />;
  return (
    <PageShell>
      <ServiceDetailBody serviceName={identity.serviceName} />
    </PageShell>
  );
}
