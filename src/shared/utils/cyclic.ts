/** A list with at least one element, so a cyclic lookup always hits. */
export type NonEmptyList<T> = readonly [T, ...T[]];

/** The element at `index`, wrapping around `items` in both directions. */
export function pickCyclic<L extends NonEmptyList<unknown>>(items: L, index: number): L[number] {
  const n = items.length;
  return items[((index % n) + n) % n] ?? items[0];
}

/**
 * Stable unsigned 32-bit string hash: FNV-1a with murmur3's finalizer, so
 * every bit is mixed and small palettes (any modulus) spread evenly.
 */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 0x01000193);
  }
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return (hash ^ (hash >>> 16)) >>> 0;
}

/** The element `key` hashes to, so the same name always gets the same entry. */
export function pickByHash<L extends NonEmptyList<unknown>>(items: L, key: string): L[number] {
  return pickCyclic(items, hashString(key));
}
