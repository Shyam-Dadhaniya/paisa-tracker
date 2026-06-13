/**
 * Generates a RFC4122-ish v4 UUID, preferring the native `crypto.randomUUID`
 * and falling back to a Math.random implementation for older runtimes.
 *
 * Stores prefix the result to namespace IDs by entity type:
 *   - expenses:        bare uuid()
 *   - custom categories: `custom_` + uuid()
 *   - payment sources:   `ps_`     + uuid()
 */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
