import { rootKey } from '../../keys';
import { InMemoryKeyValueStore } from '../../testing';
import { initialMigration } from '../001-initial';
import { CURRENT_SCHEMA_VERSION, MIGRATIONS, runMigrations } from '..';

const entries = { [rootKey('books')]: '[]', [rootKey('settings')]: '{}' };

describe('001-initial', () => {
  it('is version 1 and the first registered migration', () => {
    expect(initialMigration.version).toBe(1);
    expect(MIGRATIONS[0]).toBe(initialMigration);
  });

  it('keeps every entry, as a new object, and is idempotent', () => {
    const once = initialMigration.migrate(entries);
    expect(once).toEqual(entries);
    expect(once).not.toBe(entries);
    expect(initialMigration.migrate(once)).toEqual(once);
  });

  it('stamps existing data with the current version without rewriting it', async () => {
    const kv = new InMemoryKeyValueStore(entries);
    await runMigrations(kv, MIGRATIONS);
    expect(kv.snapshot()).toEqual({
      ...entries,
      [rootKey('schemaVersion')]: String(CURRENT_SCHEMA_VERSION),
    });
    const dataWrites = kv.calls.filter(
      c =>
        c.operation === 'setMany' && !c.keys.includes(rootKey('schemaVersion')),
    );
    expect(dataWrites.every(c => c.keys.length === 0)).toBe(true);
  });
});
