import type { ColumnDef } from "@tanstack/react-table";

import StatCard from "@shared/components/ui/cards/StatCard";
import DataTable from "@shared/components/ui/data-display/DataTable";
import { formatNumber, formatRelativeTime } from "@shared/utils/formatters";

import type { LlmUser } from "../../../api/usersApi";
import { useUsers, useUsersOverview } from "../../../hooks/useUsers";
import { formatCost } from "../../../utils/llmFormat";

const columns: ColumnDef<LlmUser>[] = [
  {
    header: "User",
    accessorKey: "userId",
    cell: ({ row: { original: u } }) => (
      <span className="truncate font-mono text-[12px] text-foreground">{u.userId}</span>
    ),
  },
  {
    header: "Top service",
    accessorKey: "topService",
    size: 160,
    cell: ({ row: { original: u } }) => (
      <span className="truncate text-[11px] text-foreground-secondary">{u.topService || "—"}</span>
    ),
  },
  {
    header: "Traces",
    accessorKey: "traces",
    size: 90,
    meta: { align: "right" },
    cell: ({ row: { original: u } }) => <span className="font-mono">{formatNumber(u.traces)}</span>,
  },
  {
    header: "Tokens",
    accessorKey: "tokens",
    size: 100,
    meta: { align: "right" },
    cell: ({ row: { original: u } }) => <span className="font-mono">{formatNumber(u.tokens)}</span>,
  },
  {
    header: "Cost",
    accessorKey: "cost",
    size: 90,
    meta: { align: "right" },
    cell: ({ row: { original: u } }) => <span className="font-mono">{formatCost(u.cost)}</span>,
  },
  {
    header: "Avg score",
    accessorKey: "avgScore",
    size: 90,
    meta: { align: "right" },
    cell: ({ row: { original: u } }) => (
      <span className="font-mono">{u.avgScore === null ? "—" : u.avgScore.toFixed(2)}</span>
    ),
  },
  {
    header: "Last seen",
    accessorKey: "lastSeenMs",
    size: 110,
    cell: ({ row: { original: u } }) => (
      <span className="text-[11px] text-foreground-muted">{formatRelativeTime(u.lastSeenMs)}</span>
    ),
  },
];

export default function UsersTab() {
  const overviewQ = useUsersOverview();
  const usersQ = useUsers();
  const o = overviewQ.data;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          metric={{ title: "Active users", value: formatNumber(o?.activeUsers ?? 0) }}
          visuals={{ loading: overviewQ.isPending }}
        />
        <StatCard
          metric={{ title: "Avg cost / user", value: formatCost(o?.avgCostPerUser ?? 0) }}
          visuals={{ loading: overviewQ.isPending }}
        />
        <StatCard
          metric={{ title: "Avg traces / user", value: (o?.avgTracesPerUser ?? 0).toFixed(1) }}
          visuals={{ loading: overviewQ.isPending }}
        />
        <StatCard
          metric={{ title: "Low-score users", value: formatNumber(o?.lowScoreUsers ?? 0) }}
          visuals={{ loading: overviewQ.isPending }}
        />
      </div>
      <DataTable
        data={{ columns, rows: usersQ.data ?? [], loading: usersQ.isPending }}
        pagination={{ showPagination: false }}
        config={{ emptyText: "No user activity in this window." }}
      />
    </div>
  );
}
