import type { ExplorerFilter, TranslationWarning } from "@shared/search/types/filters";
import {
  type BuildExtras,
  type BuildResult,
  dispatchCommonFilter,
  finalizeSearch,
  handleDurationMs,
  handleListField,
  handleSingleValue,
  initBody,
  pushUnknownField,
  pushUnsupportedOp,
} from "@shared/search/utils/buildFilters";

interface TracesFiltersBody {
  startTime: number;
  endTime: number;
  limit?: number;
  cursor?: string;
  services?: string[];
  serviceVersions?: string[];
  excludeServices?: string[];
  operations?: string[];
  spanKinds?: string[];
  httpMethods?: string[];
  httpStatuses?: string[];
  statuses?: string[];
  excludeStatuses?: string[];
  environments?: string[];
  peerServices?: string[];
  traceId?: string;
  minDurationNs?: number;
  maxDurationNs?: number;
  hasError?: boolean;
  search?: string;
  attributes?: Array<{ key: string; op?: string; value: string }>;
}

export type TracesBuildResult = BuildResult<TracesFiltersBody>;

const LIST_FIELDS: Record<
  string,
  { include: keyof TracesFiltersBody; exclude?: keyof TracesFiltersBody }
> = {
  service: { include: "services", exclude: "excludeServices" },
  serviceName: { include: "services", exclude: "excludeServices" },
  serviceVersion: { include: "serviceVersions" },
  operation: { include: "operations" },
  spanKind: { include: "spanKinds" },
  httpMethod: { include: "httpMethods" },
  httpStatus: { include: "httpStatuses" },
  status: { include: "statuses", exclude: "excludeStatuses" },
  environment: { include: "environments" },
  peerService: { include: "peerServices" },
};

export function buildTracesFilters(
  filters: readonly ExplorerFilter[],
  startTime: number,
  endTime: number,
  extras: BuildExtras = {}
): TracesBuildResult {
  const body = initBody<TracesFiltersBody>(startTime, endTime, extras);

  const warnings: TranslationWarning[] = [];
  const searchTerms: string[] = [];

  for (const filter of filters) {
    if (dispatchCommonFilter(filter, body, warnings, searchTerms)) continue;

    const { field, op, value } = filter;

    if (field in LIST_FIELDS) {
      handleListField(field, op, value, body, warnings, LIST_FIELDS[field]);
      continue;
    }

    switch (field) {
      case "traceId":
        if (op !== "eq") {
          pushUnsupportedOp(warnings, field, op, "only exact match");
        } else {
          handleSingleValue(body, "traceId", value, warnings);
        }
        break;
      case "durationMs": {
        handleDurationMs(field, op, value, body, warnings);
        break;
      }
      case "hasError":
        if (op === "eq") body.hasError = value === "true";
        else pushUnsupportedOp(warnings, field, op, "only hasError:true or hasError:false");
        break;
      default:
        pushUnknownField(warnings, field, "traces");
    }
  }

  finalizeSearch(body, searchTerms);
  return { body, warnings };
}
