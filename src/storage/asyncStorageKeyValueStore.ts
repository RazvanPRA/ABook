import AsyncStorage, {
  type AsyncStorage as AsyncStorageApi,
} from '@react-native-async-storage/async-storage';
import { assertNamespaced, isNamespaced } from './keys';
import type { Entries, KeyValueStore } from './KeyValueStore';

/**
 * `KeyValueStore` over AsyncStorage 3.x (Room/SQLite on Android). Uses the default database,
 * which keeps the `abk:` prefix as the only separation; empty batches skip the native call.
 */
export const createAsyncStorageKeyValueStore = (
  storage: AsyncStorageApi = AsyncStorage,
): KeyValueStore => ({
  async getMany(keys) {
    assertNamespaced(keys);
    return keys.length === 0 ? {} : storage.getMany([...keys]);
  },
  async setMany(entries: Entries) {
    const keys = Object.keys(entries);
    assertNamespaced(keys);
    if (keys.length > 0) {
      await storage.setMany(entries);
    }
  },
  async removeMany(keys) {
    assertNamespaced(keys);
    if (keys.length > 0) {
      await storage.removeMany([...keys]);
    }
  },
  async getAllKeys() {
    return (await storage.getAllKeys()).filter(isNamespaced);
  },
});
