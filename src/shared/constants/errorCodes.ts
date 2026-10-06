// Codes the query API returns in `error.code` (query internal/shared/errorcode
// plus the tenant middleware's FORBIDDEN_TENANT).
const VALIDATION_ERROR = "VALIDATION_ERROR" as const;
const UNAUTHORIZED = "UNAUTHORIZED" as const;
const FORBIDDEN = "FORBIDDEN" as const;
const NOT_FOUND = "NOT_FOUND" as const;
const CONFLICT = "CONFLICT" as const;
const RATE_LIMITED = "RATE_LIMITED" as const;
const TRIAL_EXPIRED = "TRIAL_EXPIRED" as const;
const QUERY_BUDGET_EXCEEDED = "QUERY_BUDGET_EXCEEDED" as const;
const FORBIDDEN_TENANT = "FORBIDDEN_TENANT" as const;

const INTERNAL_ERROR = "INTERNAL_ERROR" as const;

// Client-side codes for failures that never produced an API error body.
export const NETWORK_ERROR = "NETWORK_ERROR" as const;
export const UNKNOWN_ERROR = "UNKNOWN_ERROR" as const;

export type ErrorCode =
  | typeof VALIDATION_ERROR
  | typeof UNAUTHORIZED
  | typeof FORBIDDEN
  | typeof NOT_FOUND
  | typeof CONFLICT
  | typeof RATE_LIMITED
  | typeof TRIAL_EXPIRED
  | typeof QUERY_BUDGET_EXCEEDED
  | typeof FORBIDDEN_TENANT
  | typeof INTERNAL_ERROR
  | typeof NETWORK_ERROR
  | typeof UNKNOWN_ERROR;

export const ERROR_CODE_LABELS: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Validation failed",
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "Access denied",
  NOT_FOUND: "Not found",
  CONFLICT: "Resource conflict",
  RATE_LIMITED: "Too many requests",
  TRIAL_EXPIRED: "Trial expired",
  QUERY_BUDGET_EXCEEDED: "Query too expensive",
  FORBIDDEN_TENANT: "Tenant access denied",
  INTERNAL_ERROR: "Server error",
  NETWORK_ERROR: "Network error",
  UNKNOWN_ERROR: "An unexpected error occurred",
};
