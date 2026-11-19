// Test doubles for the storage adapters. Imported only by tests; never by app code.
export { InMemoryKeyValueStore } from './InMemoryKeyValueStore';
export type { KeyValueCall, KeyValueOperation } from './InMemoryKeyValueStore';
export { InMemoryFileStore } from './InMemoryFileStore';
export type { FileCall, FileOperation } from './InMemoryFileStore';
