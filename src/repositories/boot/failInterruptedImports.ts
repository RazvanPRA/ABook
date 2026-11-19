import type { BookMeta } from '@/shared/domain';
import type { Entries, KeyValueStore } from '@/storage';
import { metaEntry } from '../book/metaStore';

/**
 * A book still `processing` at boot was being imported when the app died. Until the pipeline can
 * resume from `processedPages` (M3c), it becomes `failed`; its saved chapters stay readable.
 */
export const failInterruptedImports = async (
  kv: KeyValueStore,
  books: readonly BookMeta[],
): Promise<BookMeta[]> => {
  const next = books.map(book =>
    book.status === 'processing'
      ? { ...book, status: 'failed' as const }
      : book,
  );
  const changed = next.filter((book, i) => book !== books[i]);
  if (changed.length > 0) {
    const entries: Entries = Object.assign({}, ...changed.map(metaEntry));
    await kv.setMany(entries);
  }
  return next;
};
