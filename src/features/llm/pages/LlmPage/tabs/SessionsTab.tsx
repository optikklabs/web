import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";

import StatCard from "@shared/components/ui/cards/StatCard";
import DataTable from "@shared/components/ui/data-display/DataTable";
import { formatDuration, formatNumber, formatRelativeTime } from "@shared/utils/formatters";

import type { LlmSession } from "../../../api/sessionsApi";
import { useSessions, useSessionsOverview } from "../../../hooks/useSessions";
import { formatCost } from "../../../utils/llmFormat";

const columns: ColumnDef<LlmSession>[] = [
  {
    header: "Session",
    accessorKey: "sessionId",
    cell: ({ row: { original: s } }) => (
      <div className="min-w-0">
        <div className="truncate font-mono text-[11px] text-foreground">{s.sessionId}</div>
        <div className="truncate text-[10px] text-foreground-muted">{s.preview || "—"}</div>
      </div>
    ),
  },
  {
    header: "User",
    accessorKey: "userId",
    size: 130,
    cell: ({ row: { original: s } }) => (
      <span className="truncate font-mono text-[11px] text-foreground-muted">
        {s.userId || "—"}
      </span>
    ),
  },
  {
    header: "Turns",
    accessorKey: "turns",
    size: 70,
    meta: { align: "right" },
    cell: ({ row: { original: s } }) => <span className="font-mono">{s.turns}</span>,
  },
  {
    header: "Duration",
    accessorKey: "durationMs",
    size: 100,
    meta: { align: "right" },
    cell: ({ row: { original: s } }) => (
      <span className="font-mono text-[11px]">{formatDuration(s.durationMs)}</span>
    ),
  },
  {
    header: "Cost",
    accessorKey: "cost",
    size: 90,
    meta: { align: "right" },
    cell: ({ row: { original: s } }) => <span className="font-mono">{formatCost(s.cost)}</span>,
  },
  {
    header: "Avg score",
    accessorKey: "avgScore",
    size: 90,
    meta: { align: "right" },
    cell: ({ row: { original: s } }) => (
      <span className="font-mono">{s.avgScore === null ? "—" : s.avgScore.toFixed(2)}</span>
    ),
  },
  {
    header: "Last seen",
    accessorKey: "lastMs",
    size: 110,
    cell: ({ row: { original: s } }) => (
      <span className="text-[11px] text-foreground-muted">{formatRelativeTime(s.lastMs)}</span>
    ),
  },
  {
    header: "",
    id: "chevron",
    size: 34,
    meta: { align: "right" },
    cell: () => <ChevronRight size={14} className="ml-auto text-foreground-muted" />,
  },
];

export default function SessionsTab() {
  const navigate = useNavigate();
  const overviewQ = useSessionsOverview();
  const sessionsQ = useSessions();
  const o = overviewQ.data;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          metric={{ title: "Sessions", value: o ? formatNumber(o.sessions) : "—" }}
          visuals={{ loading: overviewQ.isPending }}
        />
        <StatCard
          metric={{ title: "Avg turns", value: o?.avgTurns == null ? "—" : o.avgTurns.toFixed(1) }}
          visuals={{ loading: overviewQ.isPending }}
        />
        <StatCard
          metric={{
            title: "Avg duration",
            value: o?.avgDurationMs == null ? "—" : formatDuration(o.avgDurationMs),
          }}
          visuals={{ loading: overviewQ.isPending }}
        />
        <StatCard
          metric={{ title: "Avg cost", value: o?.avgCost == null ? "—" : formatCost(o.avgCost) }}
          visuals={{ loading: overviewQ.isPending }}
        />
      </div>
      <DataTable
        data={{ columns, rows: sessionsQ.data ?? [], loading: sessionsQ.isPending }}
        pagination={{ showPagination: false }}
        config={{
          emptyText: "No sessions in this window.",
          onRow: (s) => ({
            onClick: () =>
              navigate({ to: `/llm/sessions/${encodeURIComponent(s.sessionId)}` as string & {} }),
            style: { cursor: "pointer" },
          }),
        }}
      />
    </div>
  );
}
