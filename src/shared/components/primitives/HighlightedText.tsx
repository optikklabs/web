import { memo } from "react";

interface Props {
  readonly text: string;
  readonly match: string | undefined;
  readonly className?: string;
}

/**
 * Inline match-highlighting for free-text searches. Splits `text` around
 * case-insensitive occurrences of `match` and wraps each occurrence in a
 * `<mark>` tinted with `--color-primary-subtle-18`. Returns the text
 * unchanged if `match` is empty or absent.
 */
export const HighlightedText = memo(function HighlightedText({ text, match, className }: Props) {
  const parts = splitOnMatch(text, match);
  if (!match || parts.length === 1) {
    return <span className={className}>{text}</span>;
  }
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.kind === "match" ? (
          <mark
            key={i}
            className="rounded-sm bg-[var(--color-primary-subtle-18)] px-[1px] text-foreground"
          >
            {part.value}
          </mark>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </span>
  );
});

type Part = { readonly kind: "text" | "match"; readonly value: string };

function splitOnMatch(text: string, match: string | undefined): Part[] {
  if (!match || !text) return [{ kind: "text", value: text }];
  const lowerText = text.toLowerCase();
  const lowerMatch = match.toLowerCase();
  const parts: Part[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const at = lowerText.indexOf(lowerMatch, cursor);
    if (at === -1) {
      parts.push({ kind: "text", value: text.slice(cursor) });
      break;
    }
    if (at > cursor) parts.push({ kind: "text", value: text.slice(cursor, at) });
    parts.push({ kind: "match", value: text.slice(at, at + match.length) });
    cursor = at + match.length;
  }
  return parts;
}
