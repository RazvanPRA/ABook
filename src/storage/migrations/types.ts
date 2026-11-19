import type { Entries } from '../KeyValueStore';

/**
 * One schema step, from `version - 1` to `version`. `migrate` is pure: it receives every `abk:*`
 * entry except `abk:schemaVersion` and returns the full new set (a key left out is deleted).
 *
 * It must also be idempotent (`migrate(migrate(x))` equals `migrate(x)`): the runner writes the new
 * version last, so a crash in between re-runs the step on data it has already partly written.
 */
export interface Migration {
  version: number;
  name: string;
  migrate(entries: Readonly<Entries>): Entries;
}

export type MigrationOutcome =
  /** Nothing pending; nothing but the version was read. */
  | { status: 'current'; version: number }
  | { status: 'migrated'; from: number; to: number }
  /** Stored by a newer app (downgrade): left untouched. */
  | { status: 'newer'; stored: number; supported: number }
  /** `abk:schemaVersion` isn't a version number: left untouched. */
  | { status: 'invalid'; raw: string };
