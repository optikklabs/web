import { pickByHash } from "@shared/utils/cyclic";

const PALETTE_HUES = [222, 32, 268, 174, 112, 8, 296, 56, 198, 332] as const;

/**
 * Calculates a deterministic color hue (0-360) for a service name.
 */
export function svcHue(name: string): number {
  return pickByHash(PALETTE_HUES, name);
}
