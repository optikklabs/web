import { useNavigate, useSearch } from "@tanstack/react-router";

import ServiceDetailDrawer from "@shared/components/ui/drawers/ServiceDetailDrawer";
import {
  type DrawerAttrGroup,
  DrawerAttrTable,
} from "@shared/components/ui/overlay/detail-drawer/DrawerAttrTable";
import { DrawerHeader } from "@shared/components/ui/overlay/detail-drawer/DrawerHeader";
import { DrawerShell } from "@shared/components/ui/overlay/detail-drawer/DrawerShell";

import {
  clearedDashboardDrawerSearch,
  readDashboardDrawerState,
} from "./utils/dashboardDrawerState";

const ENTITY_LABELS: Record<string, string> = {
  databaseSystem: "Database System",
  errorGroup: "Error Group",
  kafkaGroup: "Kafka Consumer Group",
  kafkaTopic: "Kafka Topic",
  node: "Node",
  redisInstance: "Redis Instance",
  service: "Service",
};

function toFieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/\bDb\b/g, "DB")

    .replace(/\bHttp\b/g, "HTTP")
    .replace(/\bP95\b/g, "P95")
    .replace(/\bP99\b/g, "P99")
    .replace(/\bRss\b/g, "RSS")
    .replace(/\bVms\b/g, "VMS");
}

function toFieldValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function attrGroups(drawerData: Record<string, unknown>): DrawerAttrGroup[] {
  const contextRows = Object.keys(drawerData)
    .filter((key) => key !== "entity" && key !== "identifier")
    .sort((left, right) => left.localeCompare(right))
    .map((key) => [toFieldLabel(key), toFieldValue(drawerData[key])] as const);

  return [
    {
      label: "Selection",
      rows: [
        ["Entity", toFieldValue(drawerData.entity)],
        ["Identifier", toFieldValue(drawerData.identifier)],
      ],
    },
    ...(contextRows.length > 0 ? [{ label: "Context", rows: contextRows }] : []),
  ];
}

export default function DashboardEntityDrawer(): JSX.Element | null {
  const navigate = useNavigate();
  // Rendered by shared dashboard hosts on multiple routes, so the drawer
  // params are read route-agnostically.
  const search = useSearch({ strict: false }) as Record<string, unknown>;

  const drawer = readDashboardDrawerState(search);
  if (!drawer.entity || !drawer.id) {
    return null;
  }

  const onClose = () =>
    navigate({
      search: ((prev: Record<string, unknown>) => ({
        ...prev,
        ...clearedDashboardDrawerSearch(),
      })) as never,
      replace: true,
    });

  if (drawer.entity === "service") {
    return (
      <ServiceDetailDrawer open serviceName={drawer.id} title={drawer.title} onClose={onClose} />
    );
  }

  const title = drawer.title || (ENTITY_LABELS[drawer.entity] ?? "Details");
  const groups = attrGroups({
    entity: ENTITY_LABELS[drawer.entity] ?? drawer.entity,
    identifier: drawer.id,
    ...(drawer.data ?? {}),
  });

  return (
    <DrawerShell open onClose={onClose} title={title} width={640}>
      <DrawerHeader onClose={onClose}>
        <div className="truncate font-semibold text-[15px] text-foreground">{title}</div>
      </DrawerHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-4">
        <DrawerAttrTable groups={groups} searchable={false} />
        {!drawer.data && (
          <p className="text-foreground-secondary text-sm">
            This detail view was opened from a legacy link, so only the identifier is available
            until the parent dashboard is opened from a live row selection.
          </p>
        )}
      </div>
    </DrawerShell>
  );
}
