import { toChapterIndex, type BookId, type BookMeta } from '@/shared/domain';
import { bookIdFromKey, rootKey } from '@/storage';
import type { AppServices } from '../../dependencies';

export interface StorageStats {
  schemaVersion: string | null;
  /** Every `abk:*` key. */
  keyCount: number;
  /** Keys under `abk:book:{id}:` (any book). */
  bookKeyCount: number;
  /** Entries of `<documents>/books`. */
  files: string[];
  /** Sentences of chapter 1 read back through the repository; `null` when unreadable. */
  chapterOne: Record<BookId, number | null>;
}

const VERSION_KEY = rootKey('schemaVersion');

/** Dev only: what is actually in storage right now, independent of the store. */
export const readStorageStats = async (
  { bookRepository, stores }: AppServices,
  books: readonly BookMeta[],
): Promise<StorageStats> => {
  const keys = await stores.kv.getAllKeys();
  const version = (await stores.kv.getMany([VERSION_KEY]))[VERSION_KEY] ?? null;
  const chapterOne: Record<BookId, number | null> = {};
  for (const book of books) {
    const chapter = await bookRepository.getChapter(book.id, toChapterIndex(1));
    chapterOne[book.id] = chapter?.sentences.length ?? null;
  }
  return {
    schemaVersion: version,
    keyCount: keys.length,
    bookKeyCount: keys.filter(key => bookIdFromKey(key) !== null).length,
    files: await stores.files.list(stores.files.booksDir()),
    chapterOne,
  };
};
