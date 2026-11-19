import { logger } from '@/shared/utils';
import { rootKey } from '../keys';
import type { Entries, KeyValueStore } from '../KeyValueStore';
import type { Migration, MigrationOutcome } from './types';

const VERSION_KEY = rootKey('schemaVersion');
const VERSION_PATTERN = /^\d+$/;

type StoredVersion = { ok: true; version: number } | { ok: false; raw: string };

const readVersion = async (kv: KeyValueStore): Promise<StoredVersion> => {
  const raw = (await kv.getMany([VERSION_KEY]))[VERSION_KEY] ?? null;
  if (raw === null) {
    return { ok: true, version: 0 };
  }
  // A regex, not Number(): Number('') and Number(' ') are 0
  return VERSION_PATTERN.test(raw)
    ? { ok: true, version: Number(raw) }
    : { ok: false, raw };
};

/** Versions must be 1, 2, 3…: a gap or a duplicate is a programming error. */
const assertSequential = (migrations: readonly Migration[]): void => {
  migrations.forEach((migration, i) => {
    if (migration.version !== i + 1) {
      throw new Error(
        `Migration ${migration.name} has version ${migration.version}, expected ${i + 1}`,
      );
    }
  });
};

const readEntries = async (kv: KeyValueStore): Promise<Entries> => {
  const keys = (await kv.getAllKeys()).filter(key => key !== VERSION_KEY);
  const values = await kv.getMany(keys);
  return Object.fromEntries(
    Object.entries(values).filter(
      (entry): entry is [string, string] => entry[1] !== null,
    ),
  );
};

/** Writes only what changed, then the version, so a crash leaves the old version in place. */
const writeDiff = async (
  kv: KeyValueStore,
  diff: { before: Entries; after: Entries; version: number },
): Promise<void> => {
  const { before, after, version } = diff;
  const changed = Object.fromEntries(
    Object.entries(after).filter(([key, value]) => before[key] !== value),
  );
  const removed = Object.keys(before).filter(key => !(key in after));
  await kv.setMany(changed);
  await kv.removeMany(removed);
  await kv.setMany({ [VERSION_KEY]: String(version) });
};

/** Brings the stored data to the latest version in `migrations`. Runs in bootstrap, before hydration. */
export const runMigrations = async (
  kv: KeyValueStore,
  migrations: readonly Migration[],
): Promise<MigrationOutcome> => {
  assertSequential(migrations);
  const stored = await readVersion(kv);
  if (!stored.ok) {
    logger.warn('Invalid schema version, migrations skipped', stored.raw);
    return { status: 'invalid', raw: stored.raw };
  }
  const supported = migrations.length;
  if (stored.version > supported) {
    logger.warn('Data from a newer app version, migrations skipped', stored);
    return { status: 'newer', stored: stored.version, supported };
  }
  if (stored.version === supported) {
    return { status: 'current', version: supported };
  }
  const before = await readEntries(kv);
  const after = migrations
    .slice(stored.version)
    .reduce<Entries>(
      (entries, migration) => migration.migrate(entries),
      before,
    );
  await writeDiff(kv, { before, after, version: supported });
  return { status: 'migrated', from: stored.version, to: supported };
};
