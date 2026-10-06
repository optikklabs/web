import { pickByHash } from "@shared/utils/cyclic";
import { ownEntry } from "@shared/utils/ownEntry";

// Vendor identity: fixed gen_ai.system -> label + chart token assignment.
// Hues follow the entity, never its rank (dataviz rule).
const VENDOR_META: Record<string, { label: string; color: string }> = {
  openai: { label: "OpenAI", color: "var(--chart-3)" },
  anthropic: { label: "Anthropic", color: "var(--chart-2)" },
  "gcp.vertex_ai": { label: "Vertex AI", color: "var(--chart-1)" },
  "aws.bedrock": { label: "Bedrock", color: "var(--chart-4)" },
  azure_openai: { label: "Azure OpenAI", color: "var(--chart-6)" },
};
const VENDOR_FALLBACK_COLORS = ["var(--chart-5)", "var(--chart-7)", "var(--chart-8)"] as const;

export function vendorLabel(vendor: string): string {
  return ownEntry(VENDOR_META, vendor)?.label ?? (vendor || "unknown");
}

export function vendorColor(vendor: string): string {
  // Stable fallback: hash the name so the hue follows the vendor.
  return ownEntry(VENDOR_META, vendor)?.color ?? pickByHash(VENDOR_FALLBACK_COLORS, vendor);
}

// Span-kind identity chips (LLM / tool / retrieval / embedding / agent).
// App-kind identity chips, derived server-side from the span mix.
// Tokens/latency use shared formatNumber/formatDuration; only cost is local.
export function formatCost(n: number): string {
  if (n >= 100) return `$${Math.round(n).toLocaleString()}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n === 0) return "$0";
  return `$${n.toFixed(4)}`;
}
