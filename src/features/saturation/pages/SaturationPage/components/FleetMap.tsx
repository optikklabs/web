import { useNavigate } from "@tanstack/react-router";
import { memo, useState } from "react";

import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@shared/lib/utils";

import type { HostSaturationRow } from "../../../api/saturationApi";
import { SaturationCard } from "./SaturationCard";

type FillBy = "Saturation" | "CPU" | "Memory" | "Disk";

const FILL_OPTIONS: readonly FillBy[] = ["Saturation", "CPU", "Memory", "Disk"];

const GROUPS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "kafka", label: "Kafka" },
  { key: "database", label: "Database" },
  { key: "other", label: "Other" },
];

function metricValue(host: HostSaturationRow, fill: FillBy): number {
  switch (fill) {
    case "CPU":
      return host.cpu;
    case "Memory":
      return host.mem;
    case "Disk":
      return host.disk;
    default:
      return host.saturation;
  }
}

function fillToneClass(pct: number): string {
  if (pct >= 90) return "bg-error";
  if (pct >= 70) return "bg-warning";
  return "bg-success";
}

function shortLabel(host: string): string {
  const parts = host.split(/[-.]/).filter(Boolean);
  return (parts[parts.length - 1] || host).slice(0, 4).toUpperCase();
}

const HEX_CLIP = "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)";

function Hex({ host, fill }: { host: HostSaturationRow; fill: FillBy }) {
  const value = metricValue(host, fill);
  const navigate = useNavigate();

  return (
    <button
      type="button"
      title={`${host.host} · ${Math.round(value)}%`}
      className={cn(
        "flex h-14 w-[50px] cursor-pointer flex-col items-center justify-center border-0 font-bold text-[12px] text-white hover:opacity-90",
        fillToneClass(value)
      )}
      style={{ clipPath: HEX_CLIP }}
      onClick={() =>
        navigate({ to: ROUTES.hostDetail.replace("$host", encodeURIComponent(host.host)) as never })
      }
    >
      {Math.round(value)}
      <span className="mt-px font-semibold text-[10px] opacity-90">{shortLabel(host.host)}</span>
    </button>
  );
}

type Props = {
  hosts: HostSaturationRow[];
};

function FleetMapImpl({ hosts }: Props): JSX.Element {
  const [fill, setFill] = useState<FillBy>("Saturation");

  const groups = GROUPS.map((g) => ({
    ...g,
    hosts: hosts.filter((h) => h.subsystem === g.key),
  })).filter((g) => g.hosts.length > 0);

  return (
    <SaturationCard
      title="Fleet map"
      subtitle={`${hosts.length} hosts · color shows ${fill.toLowerCase()}`}
      right={
        <div className="inline-flex gap-[3px] rounded-md bg-[var(--bg-2)] p-[3px]">
          {FILL_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFill(opt)}
              className={cn(
                "rounded px-[10px] py-1 font-semibold text-[12px]",
                fill === opt
                  ? "bg-[var(--bg-1)] text-[var(--fg-0)] shadow-sm"
                  : "text-[var(--fg-3)]"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      }
    >
      {groups.length === 0 ? (
        <div className="px-[18px] py-6 text-[12.5px] text-[var(--fg-3)]">No hosts in range.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-[18px]">
          {groups.map((g) => (
            <div key={g.key} className="rounded-lg border border-[var(--line)] p-[14px]">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[13px] text-[var(--fg-0)]">{g.label}</div>
                <div className="text-[12px] text-[var(--fg-3)]">{g.hosts.length}</div>
              </div>
              <div className="mt-[14px] flex flex-wrap justify-center gap-2">
                {g.hosts.map((h) => (
                  <Hex key={h.host} host={h} fill={fill} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SaturationCard>
  );
}

export const FleetMap = memo(FleetMapImpl);
