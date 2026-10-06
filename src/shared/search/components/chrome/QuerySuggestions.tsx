import {
  AlertCircle,
  Bookmark,
  ChevronRight,
  Clock,
  CornerDownLeft,
  Hash,
  MessageSquare,
  Server,
  Tag,
  Wand2,
} from "lucide-react";
import { Fragment, memo } from "react";

import type { SuggestionIcon, TypeBadge } from "../../dsl/knownFields";

interface SuggestionBase {
  readonly label: string;
  readonly hint?: string;
  readonly description?: string;
  readonly category?: string;
  readonly typeBadge?: TypeBadge;
  readonly icon?: SuggestionIcon;
}

/**
 * Discriminated union over what accepting a suggestion means. The payload
 * carries the exact text the accept handler needs, so kinds are never
 * inferred from in-band string prefixes.
 */
export type SuggestionOption =
  | (SuggestionBase & { readonly kind: "field"; readonly insert: string })
  | (SuggestionBase & { readonly kind: "operator"; readonly insert: string })
  | (SuggestionBase & { readonly kind: "value"; readonly value: string })
  | (SuggestionBase & { readonly kind: "recent"; readonly query: string })
  | (SuggestionBase & { readonly kind: "template"; readonly query: string })
  | (SuggestionBase & { readonly kind: "bodyHint"; readonly token: string });

interface Props {
  readonly options: readonly SuggestionOption[];
  readonly activeIndex: number;
  readonly onSelect: (opt: SuggestionOption) => void;
  readonly onHover: (index: number) => void;
  readonly loading?: boolean;
  readonly title?: string;
  readonly highlight?: string;
}

const ICON_MAP: Record<
  SuggestionIcon,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  field: Tag,
  id: Hash,
  attr: Tag,
  severity: AlertCircle,
  resource: Server,
  body: MessageSquare,
  recent: Clock,
  view: Bookmark,
  template: Wand2,
  operator: ChevronRight,
};

const BADGE_TONE: Record<TypeBadge, string> = {
  STR: "text-info border-[color-mix(in_oklch,var(--color-info),transparent_70%)]",
  NUM: "text-warning border-[color-mix(in_oklch,var(--color-warning),transparent_70%)]",
  ID: "text-[var(--accent)] border-[color-mix(in_oklch,var(--accent),transparent_70%)]",
  TXT: "text-success border-[color-mix(in_oklch,var(--color-success),transparent_70%)]",
  ENUM: "text-[var(--fatal-c)] border-[color-mix(in_oklch,var(--fatal-c),transparent_70%)]",
  OP: "text-foreground-muted border-border",
  BOOL: "text-[var(--debug-c)] border-[color-mix(in_oklch,var(--debug-c),transparent_70%)]",
};

function QuerySuggestionsComponent(p: Props) {
  if (!p.loading && p.options.length === 0) return null;
  return (
    <div className="flex w-[480px] max-w-[calc(100vw-32px)] flex-col rounded-md border border-border bg-background shadow-2xl">
      {p.title ? (
        <div className="border-border border-b px-3 py-1.5 font-semibold text-[10px] text-foreground-muted uppercase tracking-wider">
          {p.title}
        </div>
      ) : null}
      <div className="max-h-[420px] overflow-y-auto py-1">
        {p.loading ? (
          <div className="px-3 py-2 text-[11px] text-foreground-muted">Loading…</div>
        ) : (
          <ul className="flex flex-col">
            {p.options.map((opt, i) => (
              <Fragment key={`${opt.kind}-${opt.label}-${i}`}>
                {sectionHeader(opt, i, p.options)}
                <li>
                  <Row
                    opt={opt}
                    active={i === p.activeIndex}
                    highlight={p.highlight ?? ""}
                    onHover={() => p.onHover(i)}
                    onSelect={() => p.onSelect(opt)}
                  />
                </li>
              </Fragment>
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-border border-t px-3 py-1.5 text-[10px] text-foreground-muted">
        <span>
          <Kbd>Tab</Kbd> / <Kbd>↵</Kbd> accept
        </span>
        <span>
          <Kbd>Esc</Kbd> close
        </span>
        <span>
          <Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate
        </span>
      </div>
    </div>
  );
}

function sectionHeader(opt: SuggestionOption, i: number, all: readonly SuggestionOption[]) {
  const prev = all[i - 1]?.category ?? null;
  const cur = opt.category ?? null;
  if (cur === null) return null;
  if (cur === prev) return null;
  return (
    <li
      aria-hidden="true"
      className={`px-3 ${i === 0 ? "pt-1" : "pt-2"} pb-0.5 font-semibold text-[10px] text-foreground-muted uppercase tracking-wider`}
    >
      {cur}
    </li>
  );
}

interface RowProps {
  readonly opt: SuggestionOption;
  readonly active: boolean;
  readonly highlight: string;
  readonly onHover: () => void;
  readonly onSelect: () => void;
}

function Row({ opt, active, highlight, onHover, onSelect }: RowProps) {
  const Icon = opt.icon ? ICON_MAP[opt.icon] : null;
  const label = opt.label;
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className={[
        "group flex w-full items-center gap-2 px-3 py-1.5 text-left",
        active ? "bg-secondary text-foreground" : "text-foreground-secondary hover:bg-secondary",
        active ? "border-l-2 border-l-[var(--accent)]" : "border-l-2 border-l-transparent",
      ].join(" ")}
    >
      {Icon ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-foreground-muted">
          <Icon size={12} />
        </span>
      ) : (
        <span className="h-4 w-4 shrink-0" />
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-mono text-[12px]">
          <Highlighted text={label} match={highlight} />
        </span>
        {opt.description ? (
          <span className="truncate text-[10.5px] text-foreground-muted">{opt.description}</span>
        ) : null}
      </span>
      {opt.hint ? (
        <span className="shrink-0 text-[10px] text-foreground-muted">{opt.hint}</span>
      ) : null}
      {opt.typeBadge ? (
        <span
          className={`shrink-0 rounded border px-1 py-px font-mono text-[9px] tracking-wider ${BADGE_TONE[opt.typeBadge]}`}
        >
          {opt.typeBadge}
        </span>
      ) : null}
      <span
        className={`shrink-0 text-foreground-muted ${active ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`}
      >
        <CornerDownLeft size={11} />
      </span>
    </button>
  );
}

function Highlighted({ text, match }: { text: string; match: string }) {
  if (match === "") return <>{text}</>;
  const idx = text.toLowerCase().indexOf(match.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-foreground">{text.slice(idx, idx + match.length)}</span>
      {text.slice(idx + match.length)}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-border bg-secondary px-1 py-px font-mono text-[9.5px] text-foreground-secondary">
      {children}
    </kbd>
  );
}

export const QuerySuggestions = memo(QuerySuggestionsComponent);
