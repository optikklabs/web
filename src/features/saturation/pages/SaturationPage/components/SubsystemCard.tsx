import { memo } from "react";

import type { SubsystemCardSpec } from "../view-models/subsystemSpecs";
import { SubsystemIcon } from "./SubsystemIcon";

type Props = {
  spec: SubsystemCardSpec;
};

function SubsystemCardImpl({ spec }: Props): JSX.Element {
  return (
    <a
      className="flex min-h-[152px] min-w-0 flex-col gap-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg-1)] px-5 py-[18px] text-inherit no-underline transition-[border-color] duration-150 hover:border-[var(--line-2)]"
      href={spec.href}
      aria-label={`${spec.label} subsystem`}
    >
      <div className="mb-1 flex items-center gap-[10px]">
        <span className="inline-grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-[var(--accent-bg)] text-primary">
          <SubsystemIcon name={spec.iconName} />
        </span>
        <span className="font-semibold text-[14px] text-[var(--fg-0)]">{spec.label}</span>
      </div>
      <div className="font-mono text-[11.5px] text-[var(--fg-3)]">{spec.sub}</div>
      <div className="mt-[6px] font-mono font-semibold text-[18px] text-[var(--fg-0)] tracking-[-0.01em]">
        {spec.primary}
      </div>
      <div className="-mt-[2px] font-mono text-[11.5px] text-[var(--fg-3)]">{spec.secondary}</div>
    </a>
  );
}

export const SubsystemCard = memo(SubsystemCardImpl);
