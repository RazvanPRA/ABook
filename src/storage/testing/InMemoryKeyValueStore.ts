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
  /** Per operation: how many calls still succeed before the failing one. */
  private readonly pendingFailures = new Map<KeyValueOperation, number>();

  constructor(initial: Entries = {}) {
    Object.entries(initial).forEach(([key, value]) =>
      this.data.set(key, value),
    );
  }

  /**
   * A later call of `operation` rejects without changing anything: the next one, or the one after
   * `skip` successful calls (e.g. `skip: 1` fails the second `setMany`).
   */
  failNext(operation: KeyValueOperation, { skip = 0 } = {}): void {
    this.pendingFailures.set(operation, skip);
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
    const remaining = this.pendingFailures.get(operation);
    if (remaining === undefined) {
      return;
    }
    if (remaining > 0) {
      this.pendingFailures.set(operation, remaining - 1);
      return;
    }
    this.pendingFailures.delete(operation);
    throw new Error(`Simulated ${operation} failure`);
  }
}
