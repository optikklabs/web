/**
 * Attempts to parse a string as JSON. Returns the parsed object if valid,
 * `null` otherwise. Used by LogBodyCell / ExpandedLogRow to decide whether
 * to render a JSON tree or plain text.
 */
export function tryParseJson(text: string): Record<string, unknown> | unknown[] | null {
  const trimmed = text.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as Record<string, unknown> | unknown[];
      }
    } catch {
      // Looks like JSON but is not; render the body as plain text.
    }
  }
  return null;
}
