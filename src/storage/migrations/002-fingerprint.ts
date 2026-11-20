import type { Entries } from '../KeyValueStore';
import { isMetaKey } from '../keys';
import type { Migration } from './types';

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
 * 1 → 2: `BookMeta.fingerprint` (duplicate check, M3 step 14). The PDF isn't readable from a
 * migration (it only sees key/value entries), so books imported before get `null` and are never
 * reported as duplicates. Values that aren't JSON objects are left for the meta schema to reject.
 */
export const fingerprintMigration: Migration = {
  version: 2,
  name: 'fingerprint',
  migrate: entries => {
    const next: Entries = { ...entries };
    for (const [key, raw] of Object.entries(entries)) {
      const meta = isMetaKey(key) ? parseObject(raw) : null;
      if (meta && !('fingerprint' in meta)) {
        next[key] = JSON.stringify({ ...meta, fingerprint: null });
      }
    }
    return next;
  },
};
