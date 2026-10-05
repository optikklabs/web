import { Copy } from "lucide-react";

interface DrawerJsonProps {
  readonly data: unknown;
}

function highlight(data: unknown): string {
  const json = JSON.stringify(data, null, 2) ?? "";
  const esc = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (m) => {
      let color = "var(--warn-fg)"; // number
      if (/^"/.test(m)) {
        color = /:$/.test(m) ? "var(--accent-2)" : "var(--ok)"; // key : string
      } else if (/true|false/.test(m)) {
        color = "var(--accent-violet)";
      } else if (/null/.test(m)) {
        color = "var(--fg-3)";
      }
      return `<span style="color:${color}">${m}</span>`;
    }
  );
}

export function DrawerJson({ data }: DrawerJsonProps) {
  const html = highlight(data);
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line-2)] bg-[var(--bg-card)]">
      <div className="flex items-center justify-between border-[var(--line-2)] border-b bg-[var(--bg-inset)] px-2.5 py-[7px]">
        <span className="font-semibold text-[11px] text-[var(--fg-3)] uppercase tracking-[0.06em]">
          JSON
        </span>
        <button
          type="button"
          onClick={() => void navigator.clipboard?.writeText(JSON.stringify(data, null, 2))}
          className="inline-flex h-[22px] cursor-pointer items-center gap-1 rounded-[5px] border-0 bg-transparent px-1.5 text-[12px] text-[var(--fg-2)] hover:bg-[var(--bg-card)] hover:text-[var(--fg-0)]"
        >
          <Copy size={11} /> Copy
        </button>
      </div>
      <pre
        className="m-0 overflow-x-auto whitespace-pre p-[12px_14px] font-mono text-[12px] text-[var(--fg-1)] leading-[1.55]"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: highlight() HTML-escapes input before adding fixed-palette spans
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
