import { assertNamespaced, isNamespaced } from '../keys';
import type { Entries, KeyValueStore } from '../KeyValueStore';

export type KeyValueOperation = keyof KeyValueStore;

export interface KeyValueCall {
  operation: KeyValueOperation;
  keys: string[];
}

/**
 * Test double for `KeyValueStore`. Records every call (to check write order and batch counts) and
 * can fail the next call of an operation, to simulate a crash between two writes.
 */
export class InMemoryKeyValueStore implements KeyValueStore {
  readonly calls: KeyValueCall[] = [];
  private readonly data = new Map<string, string>();
  private readonly pendingFailures = new Set<KeyValueOperation>();

  constructor(initial: Entries = {}) {
    Object.entries(initial).forEach(([key, value]) =>
      this.data.set(key, value),
    );
  }

  /** The next call of `operation` rejects without changing anything. */
  failNext(operation: KeyValueOperation): void {
    this.pendingFailures.add(operation);
  }

  /** Current content, for assertions. Includes keys outside the namespace. */
  snapshot(): Entries {
    return Object.fromEntries(this.data);
  }

  async getMany(keys: readonly string[]) {
    this.record('getMany', keys);
    return Object.fromEntries(
      keys.map(key => [key, this.data.get(key) ?? null]),
    );
  }

  async setMany(entries: Entries) {
    this.record('setMany', Object.keys(entries));
    Object.entries(entries).forEach(([key, value]) =>
      this.data.set(key, value),
    );
  }

  async removeMany(keys: readonly string[]) {
    this.record('removeMany', keys);
    keys.forEach(key => this.data.delete(key));
  }

  async getAllKeys() {
    this.record('getAllKeys', []);
    return [...this.data.keys()].filter(isNamespaced);
  }

  private record(operation: KeyValueOperation, keys: readonly string[]): void {
    this.calls.push({ operation, keys: [...keys] });
    assertNamespaced(keys);
    if (this.pendingFailures.delete(operation)) {
      throw new Error(`Simulated ${operation} failure`);
    }
  }
}
