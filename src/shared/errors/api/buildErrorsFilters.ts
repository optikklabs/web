import type { ExplorerFilter, TranslationWarning } from "@shared/search/types/filters";
import {
  type BuildExtras,
  type BuildResult,
  dispatchCommonFilter,
  handleDurationMs,
  handleListField,
  handleSingleValue,
  initBody,
  pushUnknownField,
  pushUnsupportedOp,
} from "@shared/search/utils/buildFilters";
import { ownEntry } from "@shared/utils/ownEntry";

interface ErrorsFiltersBody {
  startTime: number;
  endTime: number;
  limit?: number;
  cursor?: string;
  services?: string[];
  serviceVersions?: string[];
  excludeServices?: string[];
  operations?: string[];
  httpStatuses?: string[];
  environments?: string[];
  peerServices?: string[];
  exceptionTypes?: string[];
  traceId?: string;
  minDurationNs?: number;
  maxDurationNs?: number;
  message?: string;
  attributes?: Array<{ key: string; op?: string; value: string }>;
}

export type ErrorsBuildResult = BuildResult<ErrorsFiltersBody>;

const LIST_FIELDS: Record<
  string,
  { include: keyof ErrorsFiltersBody; exclude?: keyof ErrorsFiltersBody }
> = {
  service: { include: "services", exclude: "excludeServices" },
  serviceName: { include: "services", exclude: "excludeServices" },
  serviceVersion: { include: "serviceVersions" },
  operation: { include: "operations" },
  httpStatus: { include: "httpStatuses" },
  environment: { include: "environments" },
  peerService: { include: "peerServices" },
  exceptionType: { include: "exceptionTypes" },
};

export function buildErrorsFilters(
  filters: readonly ExplorerFilter[],
  startTime: number,
  endTime: number,
  extras: BuildExtras = {}
): ErrorsBuildResult {
  const body = initBody<ErrorsFiltersBody>(startTime, endTime, extras);

  const warnings: TranslationWarning[] = [];
  const messageTerms: string[] = [];

  for (const filter of filters) {
    if (dispatchCommonFilter(filter, body, warnings, messageTerms)) continue;

    const { field, op, value } = filter;

    const listMapping = ownEntry(LIST_FIELDS, field);

    if (listMapping) {
      handleListField(field, op, value, body, warnings, listMapping);
      continue;
    }

    switch (field) {
      case "message":
        if (op === "contains" || op === "eq") messageTerms.push(value);
        else pushUnsupportedOp(warnings, field, op, "only contains/eq supported");
        break;
      case "traceId":
        if (op === "eq") handleSingleValue(body, "traceId", value, warnings);
        else pushUnsupportedOp(warnings, field, op, "only exact match");
        break;
      case "durationMs": {
        handleDurationMs(field, op, value, body, warnings);
        break;
      }
      default:
        pushUnknownField(warnings, field, "errors");
    }
  }

  if (messageTerms.length > 0) body.message = messageTerms.join(" ");

  return { body, warnings };
}
