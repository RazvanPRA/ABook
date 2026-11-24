import { addNullMetaField } from './addMetaField';
import type { Migration } from './types';

/**
 * 1 → 2: `BookMeta.fingerprint` (duplicate check, M3 step 14). The PDF isn't readable from a
 * migration (it only sees key/value entries), so books imported before get `null` and are never
 * reported as duplicates.
 */
export const fingerprintMigration: Migration = {
  version: 2,
  name: 'fingerprint',
  migrate: entries => addNullMetaField(entries, 'fingerprint'),
};
