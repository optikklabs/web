import type { z } from "zod";

/**
 * Validate an API response against a Zod schema.
 *
 * Response schemas are tolerant readers: they strip unknown keys rather than
 * rejecting them, so a backend adding a field is a non-breaking change. What
 * a schema still rejects is a *missing* or wrong-typed required field, which
 * is the direction that corrupts the UI silently.
 *
 * Unknown keys still mean the wire has moved ahead of the schema, so dev
 * builds warn about them.
 */
export function validateResponse<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  value: unknown
): z.infer<TSchema> {
  reportUnknownKeys(schema, value);
  return schema.parse(value);
}

function reportUnknownKeys(schema: z.ZodTypeAny, value: unknown): void {
  if (!import.meta.env.DEV) return;
  const unknownKeys = collectUnknownKeys(schema, value, "");
  if (unknownKeys.length > 0) {
    console.warn(
      "[validateResponse] API contract drift — backend returned keys the schema does not declare.",
      { unknownKeys }
    );
  }
}

/** Unwrap optional/nullable/default/catch/transform wrappers to the core type. */
function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema;
  for (let depth = 0; depth < 10; depth += 1) {
    const def = current.def as { type?: string; innerType?: z.ZodTypeAny } | undefined;
    const inner = def?.innerType;
    if (!inner) return current;
    current = inner;
  }
  return current;
}

function join(path: string, key: string): string {
  return path === "" ? key : `${path}.${key}`;
}

/**
 * Walk schema and value together, collecting dotted paths of keys present on
 * the wire but absent from the schema. Union members are skipped: a key that
 * is unknown to one member may be known to another.
 */
function collectUnknownKeys(schema: z.ZodTypeAny, value: unknown, path: string): string[] {
  const core = unwrap(schema);
  const def = core.def as
    | { type?: string; shape?: Record<string, z.ZodTypeAny>; element?: z.ZodTypeAny }
    | undefined;

  if (def?.type === "array" && Array.isArray(value) && def.element) {
    const seen = new Set<string>();
    for (const item of value) {
      for (const key of collectUnknownKeys(def.element, item, `${path}[]`)) {
        seen.add(key);
      }
    }
    return [...seen];
  }

  if (def?.type === "object" && isPlainObject(value) && def.shape) {
    const shape = def.shape;
    const out: string[] = [];
    for (const key of Object.keys(value)) {
      if (key in shape) {
        out.push(...collectUnknownKeys(shape[key] as z.ZodTypeAny, value[key], join(path, key)));
      } else {
        out.push(join(path, key));
      }
    }
    return out;
  }

  return [];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
