/**
 * Returns a new array with `value` removed if present, or appended if absent.
 * Used for multi-select filter toggles (categories, payment modes, etc.).
 */
export function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}
