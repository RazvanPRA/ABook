import type { BookMeta } from '@/shared/domain';
import type { Entries } from '@/storage';
import type { BookStores } from '../book';
import { metaEntry } from '../book/metaStore';

/**
 * A book still `processing` at boot was being imported when the app died. With its PDF still in
 * place, the import resumes from `processedPages` (the import feature does that after boot);
 * without it, the book becomes `failed`, and its saved chapters stay readable.
 */
export const failUnresumableImports = async (
  { kv, files }: BookStores,
  books: readonly BookMeta[],
): Promise<BookMeta[]> => {
  const next = await Promise.all(
    books.map(async book =>
      book.status === 'processing' && !(await files.exists(book.fileUri))
        ? {
            ...book,
            status: 'failed' as const,
            failure: 'missing-file' as const,
          }
        : book,
    ),
  );
  const changed = next.filter((book, i) => book !== books[i]);
  if (changed.length > 0) {
    const entries: Entries = Object.assign({}, ...changed.map(metaEntry));
    await kv.setMany(entries);
  }
  return next;
};
