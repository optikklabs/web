import {
  type KeyboardEvent,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { formatDsl } from "../../dsl/formatDsl";
import { useDslSearchBar } from "../../hooks/useDslSearchBar";
import type { ExplorerFilter, ExplorerScope } from "../../types/filters";
import { QuerySuggestions, type SuggestionOption } from "./QuerySuggestions";

interface Props {
  readonly filters: readonly ExplorerFilter[];
  readonly onApply: (filters: readonly ExplorerFilter[], raw: string) => void;
  readonly placeholder?: string;
  readonly scope?: ExplorerScope;
  readonly valueSuggestions?: Readonly<Record<string, readonly SuggestionOption[]>>;
  readonly disableBareFreeTextFallback?: boolean;
}

function ExplorerSearchBarDslComponent(props: Props, ref: React.Ref<HTMLInputElement>) {
  const seed = formatDsl(props.filters);
  const [showPopover, setShowPopover] = useState(false);
  const innerRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRef(innerRef, ref);
  const s = useDslSearchBar({
    initial: seed,
    scope: props.scope,
    valueSuggestions: props.valueSuggestions,
  });
  useSyncSeedOnExternalChange(seed, s.input, s.setInput, s.setCaret, innerRef);
  const activeOpt = s.activeIdx >= 0 ? s.suggestions[s.activeIdx] : undefined;
  const onSelect = (opt: SuggestionOption) => {
    s.acceptSuggestion(opt);
    setShowPopover(true);
    innerRef.current?.focus();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    handleKeyDown(
      e,
      showPopover,
      setShowPopover,
      s,
      props.onApply,
      activeOpt,
      props.disableBareFreeTextFallback
    );
  };
  return (
    <DslBarLayout
      inputRef={mergedRef}
      state={s}
      showPopover={showPopover}
      setShowPopover={setShowPopover}
      onSelect={onSelect}
      onKeyDown={onKeyDown}
      placeholder={props.placeholder}
    />
  );
}

interface LayoutProps {
  readonly inputRef: React.Ref<HTMLInputElement>;
  readonly state: ReturnType<typeof useDslSearchBar>;
  readonly showPopover: boolean;
  readonly setShowPopover: (v: boolean) => void;
  readonly onSelect: (opt: SuggestionOption) => void;
  readonly onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  readonly placeholder?: string;
}

function DslBarLayout(p: LayoutProps) {
  const { state: s } = p;
  return (
    <div className="relative w-full">
      <div className={inputClass(s.parsed.errors.length > 0)}>
        <input
          ref={p.inputRef}
          type="text"
          aria-label="Search query"
          placeholder={
            p.placeholder ?? 'service:checkout durationMs:>=500 @http.statusCode:500 "timeout"'
          }
          value={s.input}
          onChange={(e) => {
            s.onChange(e.target.value, e.target.selectionStart ?? e.target.value.length);
            p.setShowPopover(true);
          }}
          onSelect={(e) => s.setCaret((e.target as HTMLInputElement).selectionStart ?? 0)}
          onFocus={() => p.setShowPopover(true)}
          onBlur={() => p.setShowPopover(false)}
          onKeyDown={p.onKeyDown}
          className="w-full bg-transparent outline-none"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      {p.showPopover ? (
        <div className="absolute top-full left-0 z-50 mt-1">
          <QuerySuggestions
            options={s.suggestions}
            activeIndex={s.activeIdx}
            onSelect={p.onSelect}
            onHover={s.setActiveIdx}
            loading={s.isLoading}
            title={popoverTitle(s.context)}
            highlight={s.context.tokenPrefix}
          />
        </div>
      ) : null}
      {s.parsed.errors[0] ? (
        <div className="mt-1 text-[10px] text-error">{s.parsed.errors[0].message}</div>
      ) : null}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  const base =
    "flex w-full items-center rounded border px-2 py-1 font-mono text-[13px] outline-none focus-within:border-[var(--accent)]";
  return hasError ? `${base} border-error bg-background` : `${base} border-border bg-background`;
}

function popoverTitle(context: ReturnType<typeof useDslSearchBar>["context"]): string | undefined {
  if (context.kind === "empty") return undefined;
  if (context.kind === "operator") return `Operators for ${context.field}`;
  if (context.kind === "attribute") return "Attributes";
  if (context.kind === "field") return "Fields";
  if (context.field) return `Values for ${context.field}`;
  return undefined;
}

function handleKeyDown(
  e: KeyboardEvent<HTMLInputElement>,
  showPopover: boolean,
  setShowPopover: (v: boolean) => void,
  s: ReturnType<typeof useDslSearchBar>,
  onApply: Props["onApply"],
  activeOpt: SuggestionOption | undefined,
  disableBareFreeTextFallback: boolean | undefined
) {
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    if (showPopover) {
      setShowPopover(false);
    } else {
      e.currentTarget.blur();
    }
    return;
  }
  if (e.key === "ArrowDown" && showPopover && s.suggestions.length > 0) {
    e.preventDefault();
    s.setActiveIdx((s.activeIdx + 1) % s.suggestions.length);
    return;
  }
  if (e.key === "ArrowUp" && showPopover && s.suggestions.length > 0) {
    e.preventDefault();
    s.setActiveIdx(s.activeIdx <= 0 ? s.suggestions.length - 1 : s.activeIdx - 1);
    return;
  }
  const tabTarget = activeOpt ?? s.suggestions[0];
  if (e.key === "Tab" && showPopover && tabTarget) {
    e.preventDefault();
    s.acceptSuggestion(tabTarget);
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();

    if (showPopover && activeOpt) {
      s.acceptSuggestion(activeOpt);
      return;
    }
    setShowPopover(false);
    s.commit();
    onApply(effectiveFilters(s, { disableBareFreeTextFallback }), s.input);
  }
}

function effectiveFilters(
  s: ReturnType<typeof useDslSearchBar>,
  opts: { readonly disableBareFreeTextFallback?: boolean } = {}
): Props["filters"] {
  if (s.parsed.filters.length > 0) return s.parsed.filters;
  if (opts.disableBareFreeTextFallback) return [];
  const raw = s.input.trim();
  if (raw === "") return [];
  return [{ field: "search", op: "contains", value: raw }];
}

function useSyncSeedOnExternalChange(
  seed: string,
  current: string,
  setInput: (v: string) => void,
  setCaret: (v: number) => void,
  inputRef: React.RefObject<HTMLInputElement | null>
) {
  const [lastSeed, setLastSeed] = useState(seed);
  useEffect(() => {
    if (seed === lastSeed) return;

    const el = inputRef.current;
    const typing = el !== null && document.activeElement === el && current !== lastSeed;
    setLastSeed(seed);
    if (seed !== current && !typing) {
      setInput(seed);
      setCaret(seed.length);
    }
  }, [seed, lastSeed, current, setInput, setCaret, inputRef]);
}

function useMergedRef(
  inner: React.RefObject<HTMLInputElement | null>,
  forwarded: React.Ref<HTMLInputElement>
): React.RefCallback<HTMLInputElement> {
  return useCallback(
    (el: HTMLInputElement | null) => {
      inner.current = el;
      if (typeof forwarded === "function") forwarded(el);
      else if (forwarded)
        (forwarded as React.MutableRefObject<HTMLInputElement | null>).current = el;
    },
    [inner, forwarded]
  );
}

export const ExplorerSearchBarDsl = memo(forwardRef(ExplorerSearchBarDslComponent));
