import { type ErrorCode, UNKNOWN_ERROR } from "@/shared/constants/errorCodes";
import { ZodError } from "zod";

export interface ApiErrorShape {
  readonly status: number;
  readonly code: ErrorCode;
  readonly message: string;
  readonly data?: unknown;
}

/**
 * Normalizes an unknown error value into a consistent ApiErrorShape.
 * Used by data fetcher hooks to present uniform error objects to consumers.
 */
export function toApiErrorShape(error: unknown): ApiErrorShape {
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      status: typeof record.status === "number" ? record.status : 0,
      code: (typeof record.code === "string" && record.code.length > 0
        ? record.code
        : UNKNOWN_ERROR) as ErrorCode,
      message:
        typeof record.message === "string" && record.message.length > 0
          ? record.message
          : "An unexpected error occurred",
      data: record.data,
    };
  }

  return { status: 0, code: UNKNOWN_ERROR, message: "An unexpected error occurred" };
}

/** The user-facing message of an API (or any) error. */
export function errorMessage(error: unknown): string {
  return toApiErrorShape(error).message;
}

export function formatErrorForDisplay(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map((i) => `${i.path.length > 0 ? i.path.join(".") : "root"}: ${i.message}`)
      .join("\n");
  }

  const shape = toApiErrorShape(error);
  const lines: string[] = [];
  if (shape.status > 0) {
    lines.push(`HTTP ${shape.status} (${shape.code})`);
  }
  lines.push(shape.message);
  const generic =
    shape.message === "An error occurred" || shape.message === "An unexpected error occurred";
  if (generic && shape.data !== undefined) {
    try {
      const extra = JSON.stringify(shape.data, null, 2);
      lines.push(extra.length > 2000 ? `${extra.slice(0, 2000)}…` : extra);
    } catch {
      // Unserializable detail (a cycle, a BigInt): show the message alone.
    }
  }
  return lines.join("\n\n");
}
