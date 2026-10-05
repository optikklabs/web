import { AxiosError, type AxiosResponse } from "axios";
import type { z } from "zod";

import { type ErrorCode, UNKNOWN_ERROR } from "@/shared/constants/errorCodes";

declare global {
  interface Window {
    telemetry?: {
      track: (event: string, data: Record<string, unknown>) => void;
    };
  }
}

interface ApiContractErrorShape {
  readonly status: number;
  readonly code: ErrorCode;
  readonly message: string;
  readonly data?: unknown;
}

interface ApiEnvelope {
  readonly success: boolean;
  readonly data: unknown;
  /** Same shape as data, for a previous period. Only when compareTo was sent. */
  readonly comparison?: unknown;
  readonly error?: unknown;
}

interface DecodeApiResponseOptions {
  readonly context: string;
  readonly expectedType?: "object" | "array";
  readonly message?: string;
}

const HTML_RESPONSE_PATTERN = /<(?:!doctype|html|head|body|title)\b/i;
const JSON_START_CHARACTERS = new Set(["{", "[", '"']);

export function isApiEnvelope(value: unknown): value is ApiEnvelope {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.success === "boolean" && "data" in record;
}

function buildPayloadPreview(value: unknown): string {
  if (typeof value === "string") {
    return value.slice(0, 240);
  }

  try {
    return JSON.stringify(value).slice(0, 240);
  } catch {
    return String(value);
  }
}

function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, "");
}

function looksLikeJson(value: string): boolean {
  if (value.length === 0) {
    return false;
  }

  return JSON_START_CHARACTERS.has(value[0] ?? "");
}

export function isHtmlLikePayload(value: unknown): boolean {
  return typeof value === "string" && HTML_RESPONSE_PATTERN.test(value);
}

export function normalizeApiPayload(value: unknown): unknown {
  let current = value;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (typeof current !== "string") {
      return current;
    }

    const trimmed = stripBom(current).trim();
    if (trimmed.length === 0) {
      return trimmed;
    }

    if (!looksLikeJson(trimmed)) {
      return trimmed;
    }

    try {
      current = JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  return current;
}

function unwrapApiPayload(value: unknown): unknown {
  let current = normalizeApiPayload(value);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (!isApiEnvelope(current)) {
      return current;
    }

    if (!current.success) {
      return current;
    }

    current = normalizeApiPayload(current.data);
  }

  return current;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createContractError(message: string, data?: unknown): ApiContractErrorShape {
  return {
    status: 0,
    code: UNKNOWN_ERROR,
    message,
    data,
  };
}

export function createInvalidApiResponseError(
  response: AxiosResponse,
  message: string,
  payload: unknown
): AxiosError {
  return new AxiosError(message, AxiosError.ERR_BAD_RESPONSE, response.config, response.request, {
    ...response,
    data: createContractError(message, {
      payloadType: typeof payload,
      preview: buildPayloadPreview(payload),
    }),
  });
}

function payloadType(value: unknown): string {
  return Array.isArray(value) ? "array" : typeof value;
}

function throwContractViolation(
  message: string,
  context: string,
  payload: unknown,
  details: Record<string, unknown>
): never {
  const data = { context, ...details, preview: buildPayloadPreview(payload) };
  if (import.meta.env.DEV) console.error(`[decodeApiResponse] ${message}`, data);
  throw createContractError(message, data);
}

function assertExpectedPayload(
  payload: unknown,
  options: DecodeApiResponseOptions,
  message: string
): void {
  if (typeof payload === "string") {
    throwContractViolation(message, options.context, payload, {
      payloadType: "string",
      looksLikeHtml: isHtmlLikePayload(payload),
    });
  }
  const receivedType = payloadType(payload);
  if (options.expectedType === "object" && !isPlainObject(payload)) {
    throwContractViolation(message, options.context, payload, {
      expectedType: "object",
      receivedType,
    });
  }
  if (options.expectedType === "array" && !Array.isArray(payload)) {
    throwContractViolation(message, options.context, payload, {
      expectedType: "array",
      receivedType,
    });
  }
}

function reportSchemaViolation(
  error: z.ZodError,
  payload: unknown,
  options: DecodeApiResponseOptions,
  message: string
): never {
  const details = {
    context: options.context,
    payloadType: payloadType(payload),
    preview: buildPayloadPreview(payload),
    error,
  };
  if (import.meta.env.DEV) console.error(`[decodeApiResponse] ${message}`, details);
  window.telemetry?.track("api_contract_violation", {
    errors: error.flatten(),
    endpoint: options.context,
    version: "1.0.0",
  });
  throw createContractError(message, {
    context: options.context,
    preview: details.preview,
    issues: error.issues,
  });
}

export function decodeApiResponse<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  value: unknown,
  options: DecodeApiResponseOptions
): z.infer<TSchema> {
  const normalized = unwrapApiPayload(value);
  const message = options.message ?? `Invalid ${options.context} response`;
  assertExpectedPayload(normalized, options, message);
  const result = schema.safeParse(normalized);
  if (!result.success) reportSchemaViolation(result.error, normalized, options, message);
  return result.data;
}
