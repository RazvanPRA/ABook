import {
  clearAllMockStorages,
  createAsyncStorage,
} from '@react-native-async-storage/async-storage/jest';
import { createAsyncStorageKeyValueStore } from '../asyncStorageKeyValueStore';
import { rootKey } from '../keys';
import type { KeyValueStore } from '../KeyValueStore';
import { InMemoryKeyValueStore } from '../testing';

const BOOKS = rootKey('books');
const SETTINGS = rootKey('settings');
const VERSION = rootKey('schemaVersion');

/** Each implementation, plus a way to plant a key outside the namespace. */
const implementations: [string, (foreign: string) => Promise<KeyValueStore>][] =
  [
    [
      'InMemoryKeyValueStore',
      async foreign => new InMemoryKeyValueStore({ [foreign]: 'x' }),
    ],
    [
      'asyncStorageKeyValueStore',
      async foreign => {
        const storage = createAsyncStorage('contract');
        await storage.setMany({ [foreign]: 'x' });
        return createAsyncStorageKeyValueStore(storage);
      },
    ],
  ];

afterEach(() => clearAllMockStorages());

describe.each(implementations)(
  '%s (KeyValueStore contract)',
  (_name, create) => {
    let store: KeyValueStore;
    beforeEach(async () => {
      store = await create('foreign:key');
    });

    it('returns null for missing keys and the value for written ones', async () => {
      await store.setMany({ [BOOKS]: '[]' });
      expect(await store.getMany([BOOKS, SETTINGS])).toEqual({
        [BOOKS]: '[]',
        [SETTINGS]: null,
      });
    });

    it('overwrites in one batch and removes, ignoring missing keys', async () => {
      await store.setMany({ [BOOKS]: '[]', [VERSION]: '0' });
      await store.setMany({ [VERSION]: '1' });
      await store.removeMany([BOOKS, SETTINGS]);
      expect(await store.getMany([BOOKS, VERSION])).toEqual({
        [BOOKS]: null,
        [VERSION]: '1',
      });
    });

    it('lists only namespaced keys', async () => {
      await store.setMany({ [BOOKS]: '[]', [SETTINGS]: '{}' });
      expect((await store.getAllKeys()).sort()).toEqual(
        [BOOKS, SETTINGS].sort(),
      );
    });

    it('accepts empty batches', async () => {
      expect(await store.getMany([])).toEqual({});
      await expect(store.setMany({})).resolves.toBeUndefined();
      await expect(store.removeMany([])).resolves.toBeUndefined();
    });

    it('rejects keys outside the namespace on every operation', async () => {
      await expect(store.getMany(['foreign:key'])).rejects.toThrow(
        /foreign:key/,
      );
      await expect(store.setMany({ settings: '{}' })).rejects.toThrow(
        /settings/,
      );
      await expect(store.removeMany(['foreign:key'])).rejects.toThrow();
    });
  },
);

describe('InMemoryKeyValueStore test helpers', () => {
  it('fails only the next call of the chosen operation, without writing', async () => {
    const store = new InMemoryKeyValueStore();
    store.failNext('setMany');
    await expect(store.setMany({ [BOOKS]: '[]' })).rejects.toThrow(/setMany/);
    expect(store.snapshot()).toEqual({});
    await store.setMany({ [BOOKS]: '[]' });
    expect(store.snapshot()).toEqual({ [BOOKS]: '[]' });
  });

  it('records the calls in order', async () => {
    const store = new InMemoryKeyValueStore();
    await store.setMany({ [BOOKS]: '[]' });
    await store.getMany([BOOKS]);
    await store.removeMany([BOOKS]);
    expect(store.calls).toEqual([
      { operation: 'setMany', keys: [BOOKS] },
      { operation: 'getMany', keys: [BOOKS] },
      { operation: 'removeMany', keys: [BOOKS] },
    ]);
  });
});
