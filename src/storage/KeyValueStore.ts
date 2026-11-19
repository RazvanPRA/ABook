/** Serialized values by key; every key is in the `abk:` namespace. */
export type Entries = Record<string, string>;

/**
 * Batch-only access to the key-value storage (AsyncStorage 3.x names). There is deliberately no
 * single-key API: reads and writes are grouped, and callers never loop over keys.
 */
export interface KeyValueStore {
  /** Every requested key is present in the result; missing ones map to `null`. */
  getMany(keys: readonly string[]): Promise<Record<string, string | null>>;
  setMany(entries: Entries): Promise<void>;
  /** Removing a missing key is not an error. */
  removeMany(keys: readonly string[]): Promise<void>;
  /** Only `abk:*` keys; whatever else shares the database is invisible. */
  getAllKeys(): Promise<string[]>;
}
