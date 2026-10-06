import type { TraceLog } from "@shared/api/traces/schemas";

import { nsToIso } from "../api/logsQueryApi";
import type { LogRecord } from "../types/log";

/**
 * Adapts a trace-scoped log (`GET /traces/{id}/logs`) to the canonical
 * `LogRecord` so trace detail can render the same shared logs table as the
 * Logs explorer. `TraceLog` is a structural superset; the only real gap is the
 * timestamp, which arrives as a uint64 nanosecond string and must be coerced
 * to ISO like every other log row.
 */
export function traceLogToLogRecord(log: TraceLog): LogRecord {
  return {
    id: log.id,
    timestamp: nsToIso(log.timestamp),
    observedTimestamp: nsToIso(log.observedTimestamp),
    serviceName: log.serviceName,
    severityText: log.severityText,
    severityBucket: log.severityBucket,
    body: log.body,
    host: log.host,
    pod: log.pod,
    container: log.container,
    environment: log.environment,
    scopeName: log.scopeName,
    scopeVersion: log.scopeVersion,
    traceId: log.traceId,
    spanId: log.spanId,
    attributesString: log.attributesString,
    attributesNumber: log.attributesNumber,
    attributesBool: log.attributesBool,
  };
}
