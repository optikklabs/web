import { type ReactNode, memo } from "react";

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

function SaturationCardImpl({ title, subtitle, right, children }: Props): JSX.Element {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--bg-1)]">
      <header className="flex items-center justify-between gap-3 border-[var(--line)] border-b px-[18px] py-[14px]">
        <div className="flex min-w-0 items-baseline gap-[10px]">
          <div className="font-semibold text-[13.5px] text-[var(--fg-0)] tracking-[-0.005em]">
            {title}
          </div>
          {subtitle ? (
            <div className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11.5px] text-[var(--fg-3)]">
              {subtitle}
            </div>
          ) : null}
        </div>
        {right ? <div>{right}</div> : null}
      </header>
      <div className="p-0">{children}</div>
    </section>
  );
}

export const SaturationCard = memo(SaturationCardImpl);
