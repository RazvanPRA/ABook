import { bookMetaSchema } from '@/shared/domain';
import { BOOK_IDS } from '@/shared/domain/__fixtures__/books';
import { rawMeta } from '@/shared/domain/__fixtures__/rawValues';
import { bookKey, rootKey } from '../../keys';
import { InMemoryKeyValueStore } from '../../testing';
import { fingerprintMigration } from '../002-fingerprint';
import { MIGRATIONS, runMigrations } from '..';

const [A, B, C] = BOOK_IDS as [
  (typeof BOOK_IDS)[number],
  (typeof BOOK_IDS)[number],
  (typeof BOOK_IDS)[number],
];

/** A meta as schema 1 stored it: no `fingerprint` key. */
const v1Meta = (id: string) => {
  const meta: Record<string, unknown> = rawMeta({ id });
  delete meta.fingerprint;
  return JSON.stringify(meta);
};

const entries = {
  [rootKey('books')]: JSON.stringify([A, B]),
  [bookKey(A, 'meta')]: v1Meta(A),
  [bookKey(B, 'meta')]: JSON.stringify(rawMeta({ id: B, fingerprint: '9:ab' })),
  [bookKey(C, 'meta')]: 'not json',
  [bookKey(A, 'toc')]: '[]',
};

describe('002-fingerprint', () => {
  it('is version 2, registered after 001', () => {
    expect(fingerprintMigration.version).toBe(2);
    expect(MIGRATIONS[1]).toBe(fingerprintMigration);
  });

  it('gives schema-1 metas a null fingerprint, valid for the new schema', () => {
    const next = fingerprintMigration.migrate(entries);
    const meta: unknown = JSON.parse(next[bookKey(A, 'meta')] ?? 'null');
    expect(meta).toMatchObject({ id: A, fingerprint: null });
    expect(bookMetaSchema.safeParse(meta).success).toBe(true);
  });

  it('leaves a meta that has a fingerprint, other keys and invalid values untouched', () => {
    const next = fingerprintMigration.migrate(entries);
    for (const key of [
      bookKey(B, 'meta'),
      bookKey(C, 'meta'),
      bookKey(A, 'toc'),
      rootKey('books'),
    ]) {
      expect(next[key]).toBe(entries[key]);
    }
    expect(
      fingerprintMigration.migrate({ [bookKey(C, 'meta')]: '[1]' }),
    ).toEqual({ [bookKey(C, 'meta')]: '[1]' });
  });

  it('is idempotent', () => {
    const once = fingerprintMigration.migrate(entries);
    expect(fingerprintMigration.migrate(once)).toEqual(once);
  });

  it('migrates stored schema-1 data through the runner, writing only the changed meta', async () => {
    const kv = new InMemoryKeyValueStore({
      ...entries,
      [rootKey('schemaVersion')]: '1',
    });
    await runMigrations(kv, MIGRATIONS.slice(0, 2));
    expect(kv.snapshot()[rootKey('schemaVersion')]).toBe('2');
    const dataWrite = kv.calls.find(
      c =>
        c.operation === 'setMany' &&
        c.keys.length > 0 &&
        !c.keys.includes(rootKey('schemaVersion')),
    );
    expect(dataWrite?.keys).toEqual([bookKey(A, 'meta')]);
  });
});
