import { z } from "zod";

import type { RequestTime } from "@/shared/api/service-types";

import { datastoreSystemRowSchema } from "./datastoresExplorerSchemas";
import type { DatastoreSystemRow } from "./datastoresExplorerSchemas";
import { getSaturation, rangeParams } from "./saturationClient";

export function getDatastoreSystems(
  startTime: RequestTime,
  endTime: RequestTime
): Promise<DatastoreSystemRow[]> {
  return getSaturation(
    "/saturation/datastores/systems",
    z.array(datastoreSystemRowSchema),
    rangeParams(startTime, endTime)
  );
}
