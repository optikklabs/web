import { KpiCard } from "@shared/components/ui/cards/StatCard";
import { ClientExplorerLayout } from "@shared/search/components/chrome/ClientExplorerLayout";
import type { ClientExplorerDefinition } from "@shared/search/hooks/useClientExplorer";
import { useClientExplorerController } from "@shared/search/hooks/useClientExplorerController";

import type { DatastoreSystemRow } from "@/features/saturation/api/datastoresExplorerSchemas";
import { DatabaseExplorerNav } from "@/features/saturation/components/DatabaseExplorerNav";
import { fmtNum } from "@shared/utils/formatters";

import { useDatastoreSystems } from "../../hooks/useDatastoreSystems";
import { STATUS_LABEL, instanceStatus } from "./databaseInstanceModel";
import { useDatabaseSystemSparklines } from "./hooks/useDatabaseSystemSparklines";
import { DatabaseInstancesTable } from "./list/DatabaseInstancesTable";

const DATABASE_EXPLORER: ClientExplorerDefinition<DatastoreSystemRow> = {
  fields: {
    system: { label: "System", value: (row) => row.system, facet: true },
    category: { label: "Category", value: (row) => row.category, facet: true },
    status: {
      label: "Status",
      value: (row) => STATUS_LABEL[instanceStatus(row)],
      facet: true,
    },
    queryCount: { label: "Queries", value: (row) => row.queryCount },
    avgMs: { label: "Average latency", value: (row) => row.avgLatencyMs },
    p95Ms: { label: "P95 latency", value: (row) => row.p95LatencyMs },
    errorRate: { label: "Error rate", value: (row) => row.errorRate },
    connections: { label: "Connections", value: (row) => row.activeConnections },
  },
  searchText: (row) => `${row.system} ${row.category} ${row.region}`,
};

export default function SaturationDatabasePage() {
  const systemsQ = useDatastoreSystems();
  const sparklines = useDatabaseSystemSparklines();
  const systems = systemsQ.data ?? [];
  const explorer = useClientExplorerController({ rows: systems, definition: DATABASE_EXPLORER });
  const healthy = explorer.rows.filter((s) => instanceStatus(s) === "ok").length;
  const attention = explorer.rows.length - healthy;
  const queryCount = explorer.rows.reduce((sum, row) => sum + row.queryCount, 0);
  const loading = systemsQ.isPending;

  return (
    <ClientExplorerLayout
      {...explorer}
      scope="database-instances"
      searchPlaceholder="Search database systems: status:degraded system:postgresql p95Ms:>=500"
      actions={<DatabaseExplorerNav active="systems" />}
      content={
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Systems" value={fmtNum(explorer.rows.length)} subtext="monitored" />
            <KpiCard label="Queries" value={fmtNum(queryCount)} subtext="in window" />
            <KpiCard label="Healthy" value={fmtNum(healthy)} tone="ok" subtext="systems" />
            <KpiCard
              label="Need attention"
              value={fmtNum(attention)}
              tone={attention > 0 ? "warn" : "ok"}
              subtext="degraded or critical"
            />
          </div>

          {systemsQ.isError ? (
            <div
              className="rounded-md border border-error bg-error-subtle px-3 py-2 text-error text-sm"
              role="alert"
            >
              Could not load database systems: {systemsQ.error.message}
            </div>
          ) : null}

          <DatabaseInstancesTable rows={explorer.rows} loading={loading} sparklines={sparklines} />
        </div>
      }
    />
  );
}
