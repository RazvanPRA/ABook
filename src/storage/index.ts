// Public API of storage. Used only by src/repositories and src/app (wiring).
export {
  NAMESPACE,
  bookIdFromKey,
  bookKey,
  bookPrefix,
  chapterKey,
  chapterPartsPrefix,
  isMetaKey,
  isNamespaced,
  rootKey,
} from './keys';
export type { BookKeyName, RootKeyName } from './keys';
export type { Entries, KeyValueStore } from './KeyValueStore';
export { createAsyncStorageKeyValueStore } from './asyncStorageKeyValueStore';
export type { FileStore } from './FileStore';
export { createReactNativeFsFileStore } from './reactNativeFsFileStore';
