/**
 * Deterministic service → color mapping. Same service name always returns the
 * same color so the service/trace list is visually stable across refreshes.
 * Palette mirrors the 12-hue set Datadog uses for service topology coloring.
 */
const SERVICE_PALETTE = [
  "#4285f4",
  "#9b59b6",
  "#06aed5",
  "#27ae60",
  "#e67e22",
  "#e91e8c",
  "#f39c12",
  "#16a085",
  "#2980b9",
  "#8e44ad",
  "#c0392b",
  "#1abc9c",
] as const;

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
}

export function getServiceColor(serviceName: string): string {
  const idx = djb2(serviceName) % SERVICE_PALETTE.length;
  return SERVICE_PALETTE[idx] ?? SERVICE_PALETTE[0];
}
