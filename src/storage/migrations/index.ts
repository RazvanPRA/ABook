import { initialMigration } from './001-initial';
import { fingerprintMigration } from './002-fingerprint';
import { failureReasonMigration } from './003-failure-reason';
import type { Migration } from './types';

/** Every migration, in order. A new schema change appends `00N-<name>.ts` here, with its test. */
export const MIGRATIONS: readonly Migration[] = [
  initialMigration,
  fingerprintMigration,
  failureReasonMigration,
];

export const CURRENT_SCHEMA_VERSION = MIGRATIONS.length;

export { runMigrations } from './runMigrations';
export type { Migration, MigrationOutcome } from './types';
