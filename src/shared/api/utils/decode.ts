import type { ApiErrorShape } from "./errorNormalization";

import { UNKNOWN_ERROR } from "@/shared/constants/errorCodes";

/** The query API wraps every successful payload in this envelope. */
interface ApiEnvelope {
  readonly success: true;
  readonly data?: unknown;
  /** Same shape as data, for a previous period. Only when compareTo was sent. */
  readonly comparison?: unknown;
}

export function isApiEnvelope(value: unknown): value is ApiEnvelope {
  return typeof value === "object" && value !== null && (value as ApiEnvelope).success === true;
}

/** An error for a 2xx response that is not an API envelope. */
export function invalidResponseError(payload: unknown): ApiErrorShape {
  const preview = typeof payload === "string" ? payload : JSON.stringify(payload);
  return {
    status: 0,
    code: UNKNOWN_ERROR,
    message: "The server returned an invalid API response",
    data: { preview: preview?.slice(0, 240) },
  };
}
