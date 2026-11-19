import { bookKey, rootKey } from '../../keys';
import type { Entries } from '../../KeyValueStore';
import { InMemoryKeyValueStore } from '../../testing';
import { runMigrations } from '../runMigrations';
import type { Migration } from '../types';
import { toBookId } from '@/shared/domain';

const VERSION = rootKey('schemaVersion');
const SETTINGS = rootKey('settings');
const BOOKS = rootKey('books');
const META = bookKey(toBookId('0b6f2f4e-7c1a-4d8e-9f3a-2a5b6c7d8e9f'), 'meta');

/** v1: adds a default settings value. v2: drops `abk:books` and renames a field in settings. */
const v1: Migration = {
  version: 1,
  name: 'add-settings',
  migrate: entries => ({ [SETTINGS]: '{"rate":1}', ...entries }),
};
const v2: Migration = {
  version: 2,
  name: 'rename-rate',
  migrate: ({ [BOOKS]: _dropped, ...entries }) => ({
    ...entries,
    [SETTINGS]: (entries[SETTINGS] ?? '{}').replace('"rate"', '"defaultRate"'),
  }),
};

const store = (entries: Entries) => new InMemoryKeyValueStore(entries);
const writes = (kv: InMemoryKeyValueStore) =>
  kv.calls.filter(
    c => c.operation !== 'getMany' && c.operation !== 'getAllKeys',
  );

describe('runMigrations', () => {
  it('stamps an empty install with the latest version', async () => {
    const kv = store({});
    expect(await runMigrations(kv, [v1, v2])).toEqual({
      status: 'migrated',
      from: 0,
      to: 2,
    });
    expect(kv.snapshot()).toEqual({
      [VERSION]: '2',
      [SETTINGS]: '{"defaultRate":1}',
    });
  });

  it('applies only the pending migrations, in order', async () => {
    const kv = store({
      [VERSION]: '1',
      [SETTINGS]: '{"rate":2}',
      [BOOKS]: '[]',
    });
    await runMigrations(kv, [v1, v2]);
    expect(kv.snapshot()).toEqual({
      [VERSION]: '2',
      [SETTINGS]: '{"defaultRate":2}',
    });
  });

  it('writes only the diff, removals included, and the version last', async () => {
    const kv = store({
      [VERSION]: '1',
      [SETTINGS]: '{"rate":2}',
      [BOOKS]: '[]',
      [META]: '{}',
    });
    await runMigrations(kv, [v1, v2]);
    expect(writes(kv)).toEqual([
      { operation: 'setMany', keys: [SETTINGS] },
      { operation: 'removeMany', keys: [BOOKS] },
      { operation: 'setMany', keys: [VERSION] },
    ]);
  });

  it('reads nothing but the version when already current', async () => {
    const kv = store({ [VERSION]: '2', [SETTINGS]: '{}' });
    expect(await runMigrations(kv, [v1, v2])).toEqual({
      status: 'current',
      version: 2,
    });
    expect(kv.calls).toEqual([{ operation: 'getMany', keys: [VERSION] }]);
  });

  it('re-runs to the same result after a crash before the version write', async () => {
    const initial = { [VERSION]: '0', [BOOKS]: '[]' };
    const crashed = store(initial);
    crashed.failNext('setMany', { skip: 1 });
    await expect(runMigrations(crashed, [v1, v2])).rejects.toThrow();
    expect(crashed.snapshot()[VERSION]).toBe('0');

    await runMigrations(crashed, [v1, v2]);
    const clean = store(initial);
    await runMigrations(clean, [v1, v2]);
    expect(crashed.snapshot()).toEqual(clean.snapshot());
  });

  it.each([
    ['newer', { [VERSION]: '5' }, { status: 'newer', stored: 5, supported: 2 }],
    ['invalid', { [VERSION]: 'abc' }, { status: 'invalid', raw: 'abc' }],
    ['empty', { [VERSION]: '' }, { status: 'invalid', raw: '' }],
    ['negative', { [VERSION]: '-1' }, { status: 'invalid', raw: '-1' }],
  ])(
    'leaves a %s version untouched and logs it',
    async (_case, entries, outcome) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const kv = store({ ...entries, [SETTINGS]: '{}' });
      expect(await runMigrations(kv, [v1, v2])).toEqual(outcome);
      expect(writes(kv)).toEqual([]);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    },
  );

  it.each([
    ['a gap', [v2]],
    ['a duplicate', [v1, v1]],
  ])('rejects a migration list with %s', async (_case, migrations) => {
    await expect(runMigrations(store({}), migrations)).rejects.toThrow(
      /version/,
    );
  });

  it('never hands the version key to a migration', async () => {
    const seen: string[] = [];
    const spy: Migration = {
      ...v1,
      migrate: e => {
        seen.push(...Object.keys(e));
        return { ...e };
      },
    };
    await runMigrations(store({ [SETTINGS]: '{}' }), [spy]);
    expect(seen).toEqual([SETTINGS]);
  });
});
