import { addNullMetaField } from './addMetaField';
import type { Migration } from './types';

/**
 * 2 → 3: `BookMeta.failure` (the details screen says why an import failed, M4 step 2). The reason of
 * a book that failed before wasn't kept, so every existing book gets `null`.
 */
export const failureReasonMigration: Migration = {
  version: 3,
  name: 'failure-reason',
  migrate: entries => addNullMetaField(entries, 'failure'),
};
