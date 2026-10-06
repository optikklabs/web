import type { ExplorerFilter, TranslationWarning } from "@shared/search/types/filters";
import {
  type BuildExtras,
  type BuildResult,
  appendArr,
  dispatchCommonFilter,
  finalizeSearch,
  handleListField,
  handleSingleValue,
  initBody,
  listValues,
  pushUnknownField,
  pushUnsupportedOp,
} from "@shared/search/utils/buildFilters";
import { ownEntry } from "@shared/utils/ownEntry";

/**
 * Single source of truth for translating `ExplorerFilter[]` (FE chip model)
 * into the BE wire body for the four logs read endpoints (`/logs/query`,
 * `/logs/summary`, `/logs/trend`, `/logs/facets`). Mirrors the embedded
 * `filter.Filters` shape on the backend (`internal/modules/logs/filter/filter.go`).
 *
 *   Resource dims (service/host/pod/…)  → typed include/exclude arrays
 *   `severityText` (eq/neq)            → `severities` / `excludeSeverities`
 *   `traceId` / `spanId` (eq)         → single-value fields (later wins logged)
 *   `body` / `search` (contains|eq)     → joined into `search` (substring)
 *   `@<key>`                            → `attributes[]` with eq/neq/contains/regex/gt/gte/lt/lte/exists/not_exists
 *   anything else                       → `warnings[]` so the UI can surface a soft
 *                                          notice under the search bar
 */

// ---------- public types ----------

interface LogsFiltersBody {
  startTime: number;
  endTime: number;
  limit?: number;
  cursor?: string;

  services?: string[];
  excludeServices?: string[];
  hosts?: string[];
  excludeHosts?: string[];
  pods?: string[];
  containers?: string[];
  environments?: string[];
  severities?: string[];
  excludeSeverities?: string[];

  traceId?: string;
  spanId?: string;
  search?: string;

  attributes?: Array<{
    readonly key: string;
    readonly op?: string;
    readonly value: string;
  }>;
}

export type { BuildResult };

/** field -> include array, plus optional exclude array for neq/not_in. */
const LIST_FIELDS: Record<
  string,
  { include: keyof LogsFiltersBody; exclude?: keyof LogsFiltersBody }
> = {
  serviceName: { include: "services", exclude: "excludeServices" },
  host: { include: "hosts", exclude: "excludeHosts" },
  pod: { include: "pods" },
  container: { include: "containers" },
  environment: { include: "environments" },
};

export function buildLogsFilters(
  filters: readonly ExplorerFilter[],
  startTime: number,
  endTime: number,
  extras: BuildExtras = {}
): BuildResult<LogsFiltersBody> {
  const body = initBody<LogsFiltersBody>(startTime, endTime, extras);
  const warnings: TranslationWarning[] = [];
  const searchTerms: string[] = [];

  for (const filter of filters) {
    // Try shared handlers first (attributes, search/body)
    if (dispatchCommonFilter(filter, body, warnings, searchTerms)) continue;

    const { field, op, value } = filter;

    const listMapping = ownEntry(LIST_FIELDS, field);

    if (listMapping) {
      handleListField(field, op, value, body, warnings, listMapping);
      continue;
    }

    switch (field) {
      case "traceId":
        handleSingleValue(body, "traceId", value, warnings);
        break;
      case "spanId":
        handleSingleValue(body, "spanId", value, warnings);
        break;
      case "severityText":
        handleSeverity(op, value, body, warnings);
        break;
      default:
        pushUnknownField(warnings, field, "logs");
    }
  }

  finalizeSearch(body, searchTerms);
  return { body, warnings };
}

function handleSeverity(
  op: string,
  value: string,
  body: LogsFiltersBody,
  warnings: TranslationWarning[]
): void {
  if (op === "eq" || op === "in") {
    appendArr(body, "severities", listValues(op, value));
    return;
  }
  if (op === "neq" || op === "not_in") {
    appendArr(body, "excludeSeverities", listValues(op, value));
    return;
  }
  pushUnsupportedOp(warnings, "severityText", op, "only match / any-of");
}
