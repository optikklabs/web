import { SaturationSubnav } from "@/features/saturation/components/SaturationSubnav";

import { FleetMap } from "./components/FleetMap";
import { MostSaturatedHostsTable } from "./components/MostSaturatedHostsTable";
import { SaturationOverviewHeader } from "./components/SaturationOverviewHeader";
import { SubsystemCardsRow } from "./components/SubsystemCardsRow";
import { useSaturationOverviewModel } from "./hooks/useSaturationOverviewModel";

export default function SaturationPage(): JSX.Element {
  const model = useSaturationOverviewModel();
  return (
    <div className="flex min-w-0 flex-col gap-5 px-1 pt-1 pb-7 font-sans text-[13px] text-[var(--fg-1)] [font-feature-settings:'ss01','cv11','tnum'] [&_*]:box-border [&_.mono]:font-mono [&_code]:font-mono">
      <SaturationOverviewHeader summary={model.summary} />
      <SaturationSubnav active="overview" counts={{ kafka: model.counts.topics }} />

      {model.error ? (
        <div
          className="rounded-lg border border-[color-mix(in_oklch,var(--color-error),transparent_65%)] bg-error-subtle px-[14px] py-[10px] text-[12.5px] text-error"
          role="alert"
        >
          Could not load saturation data: {model.error.message}
        </div>
      ) : null}

      <SubsystemCardsRow cards={model.cards} />
      <FleetMap hosts={model.hosts} />
      <MostSaturatedHostsTable rows={model.topHosts} />
    </div>
  );
}
