import { useMemo } from "react";

import type { DatastoreSystemRow } from "@/features/saturation/api/datastoresExplorerSchemas";
import { useDatastoreSystems } from "@/features/saturation/hooks/useDatastoreSystems";

interface DatabaseInstanceResult {
  readonly row: DatastoreSystemRow | null;
  readonly isPending: boolean;
}

// Resolve one instance from the fleet list (the backend has no per-system
// detail endpoint). react-query dedupes this with the list page's fetch.
export function useDatabaseInstance(system: string): DatabaseInstanceResult {
  const { data, isPending } = useDatastoreSystems();
  const row = useMemo(() => data?.find((r) => r.system === system) ?? null, [data, system]);
  return { row, isPending };
}
