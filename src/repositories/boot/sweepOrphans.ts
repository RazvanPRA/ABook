import { bookIdSchema, type BookId } from '@/shared/domain';
import { logger } from '@/shared/utils';
import { bookIdFromKey, type FileStore, type KeyValueStore } from '@/storage';
import type { BootSnapshot, OrphanSweep } from './BootRepository';

const PDF_SUFFIX = '.pdf';

const isOrphan = (id: BookId | null, listed: ReadonlySet<BookId>): boolean =>
  id !== null && !listed.has(id);

/** `{id}.pdf` → the id; any other name (not ours) → null, and it is left alone. */
const bookIdFromFileName = (name: string): BookId | null => {
  if (!name.endsWith(PDF_SUFFIX)) {
    return null;
  }
  const parsed = bookIdSchema.safeParse(name.slice(0, -PDF_SUFFIX.length));
  return parsed.success ? parsed.data : null;
};

/**
 * Keys and PDFs of ids missing from `abk:books`: what an interrupted delete (removed from the order
 * first) or import (file copied, meta not yet written) leaves behind. Skipped entirely when the
 * order is invalid, since every book would then look orphaned.
 */
export const sweepOrphans = async (
  stores: { kv: KeyValueStore; files: FileStore },
  snapshot: BootSnapshot,
): Promise<OrphanSweep> => {
  if (!snapshot.orderValid) {
    logger.warn('Library order is invalid, orphan sweep skipped');
    return { keys: 0, files: 0 };
  }
  const { kv, files } = stores;
  const listed = new Set(snapshot.order);
  const keys = snapshot.keys.filter(key =>
    isOrphan(bookIdFromKey(key), listed),
  );
  const pdfs = (await files.list(files.booksDir())).filter(name =>
    isOrphan(bookIdFromFileName(name), listed),
  );
  await kv.removeMany(keys);
  for (const name of pdfs) {
    await files.remove(`${files.booksDir()}/${name}`);
  }
  if (keys.length > 0 || pdfs.length > 0) {
    logger.warn('Removed orphaned book data', {
      keys: keys.length,
      files: pdfs.length,
    });
  }
  return { keys: keys.length, files: pdfs.length };
};
