import { bookMetaSchema } from '@/shared/domain';
import { BOOK_IDS } from '@/shared/domain/__fixtures__/books';
import { rawMeta } from '@/shared/domain/__fixtures__/rawValues';
import { bookKey, rootKey } from '../../keys';
import { InMemoryKeyValueStore } from '../../testing';
import { failureReasonMigration } from '../003-failure-reason';
import { CURRENT_SCHEMA_VERSION, MIGRATIONS, runMigrations } from '..';

const [A, B, C] = BOOK_IDS as [
  (typeof BOOK_IDS)[number],
  (typeof BOOK_IDS)[number],
  (typeof BOOK_IDS)[number],
];

/** A meta as schema 2 stored it: no `failure` key. */
const v2Meta = (id: string) => {
  const meta: Record<string, unknown> = rawMeta({ id });
  delete meta.failure;
  return JSON.stringify(meta);
};

const entries = {
  [rootKey('books')]: JSON.stringify([A, B]),
  [bookKey(A, 'meta')]: v2Meta(A),
  [bookKey(B, 'meta')]: JSON.stringify(
    rawMeta({ id: B, status: 'failed', failure: 'scanned' }),
  ),
  [bookKey(C, 'meta')]: 'not json',
  [bookKey(A, 'toc')]: '[]',
};

describe('003-failure-reason', () => {
  it('is version 3, registered after 002', () => {
    expect(failureReasonMigration.version).toBe(3);
    expect(MIGRATIONS[2]).toBe(failureReasonMigration);
    expect(CURRENT_SCHEMA_VERSION).toBe(3);
  });

  it('gives schema-2 metas a null failure, valid for the new schema', () => {
    const next = failureReasonMigration.migrate(entries);
    const meta: unknown = JSON.parse(next[bookKey(A, 'meta')] ?? 'null');
    expect(meta).toMatchObject({ id: A, failure: null });
    expect(bookMetaSchema.safeParse(meta).success).toBe(true);
  });

  it('leaves a meta that has a failure, other keys and invalid values untouched', () => {
    const next = failureReasonMigration.migrate(entries);
    for (const key of [
      bookKey(B, 'meta'),
      bookKey(C, 'meta'),
      bookKey(A, 'toc'),
      rootKey('books'),
    ]) {
      expect(next[key]).toBe(entries[key]);
    }
    expect(
      failureReasonMigration.migrate({ [bookKey(C, 'meta')]: '[1]' }),
    ).toEqual({ [bookKey(C, 'meta')]: '[1]' });
  });

  it('is idempotent', () => {
    const once = failureReasonMigration.migrate(entries);
    expect(failureReasonMigration.migrate(once)).toEqual(once);
  });

  it('migrates stored schema-2 data through the runner, writing only the changed meta', async () => {
    const kv = new InMemoryKeyValueStore({
      ...entries,
      [rootKey('schemaVersion')]: '2',
    });
    await runMigrations(kv, MIGRATIONS);
    expect(kv.snapshot()[rootKey('schemaVersion')]).toBe('3');
    const dataWrite = kv.calls.find(
      c =>
        c.operation === 'setMany' &&
        c.keys.length > 0 &&
        !c.keys.includes(rootKey('schemaVersion')),
    );
    expect(dataWrite?.keys).toEqual([bookKey(A, 'meta')]);
  });
});
