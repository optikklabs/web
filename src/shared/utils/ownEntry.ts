/**
 * Looks `key` up as an own property of `map`, so inherited keys such as
 * `toString` never match and arbitrary strings index the map safely.
 */
export function ownEntry<T extends object>(map: T, key: string): T[keyof T] | undefined {
  return Object.hasOwn(map, key) ? map[key as keyof T] : undefined;
}
