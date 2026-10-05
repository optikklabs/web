import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import type { DatastoreSystemRow } from "@/features/saturation/api/datastoresExplorerSchemas";
import { ROUTES } from "@/shared/constants/routes";
import { fmtMs, fmtPct } from "@shared/utils/formatters";

import { StatusPill } from "@shared/components/ui/data-display/status/StatusPill";

import { DbEngineIcon } from "@/features/saturation/pages/SaturationDatabasePage/components/DbEngineIcon";
import {
  INSTANCE_HEALTH,
  STATUS_LABEL,
  instanceStatus,
} from "@/features/saturation/pages/SaturationDatabasePage/databaseInstanceModel";

function statusDetail(row: DatastoreSystemRow): string | null {
  const status = instanceStatus(row);
  if (status === "ok") return null;
  if (row.errorRate >= 1) return `error rate ${fmtPct(row.errorRate, 1)}`;
  return `p95 ${fmtMs(row.p95LatencyMs)}`;
}

export function DatabaseDetailHeader({ row }: { row: DatastoreSystemRow }) {
  const status = instanceStatus(row);
  const detail = statusDetail(row);
  return (
    <header className="flex flex-col gap-3">
      <Link
        to={ROUTES.database}
        className="flex w-fit items-center gap-1.5 text-[12px] text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft size={13} />
        All databases
      </Link>

      <div className="flex items-start gap-3">
        <DbEngineIcon system={row.system} size={40} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono font-semibold text-[20px] text-foreground">{row.system}</h1>
            <StatusPill status={INSTANCE_HEALTH[status]} label={detail ?? STATUS_LABEL[status]} />
          </div>
          <div className="text-[12px] text-foreground-muted">
            {row.category} · {row.region || "unknown region"}
          </div>
        </div>
      </div>
    </header>
  );
}
