import type { Entries } from '../KeyValueStore';
import { isMetaKey } from '../keys';

/** A stored meta as a plain object, or `null` when the value isn't a JSON object. */
function parseObject(raw: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? { ...value }
      : null;
  } catch {
    return null;
  }
}

/**
 * Gives every stored meta that lacks `field` a `null` one. Values that aren't JSON objects are left
 * for the meta schema to reject. Pure and idempotent, as migrations must be.
 */
export function addNullMetaField(
  entries: Readonly<Entries>,
  field: string,
): Entries {
  const next: Entries = { ...entries };
  for (const [key, raw] of Object.entries(entries)) {
    const meta = isMetaKey(key) ? parseObject(raw) : null;
    if (meta && !(field in meta)) {
      next[key] = JSON.stringify({ ...meta, [field]: null });
    }
  }
  return next;
}
