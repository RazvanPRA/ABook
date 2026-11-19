import type { BookId } from '@/shared/domain';
import { bookPrefix, type FileStore, type KeyValueStore } from '@/storage';
import { orderEntry, readOrder, withoutBook } from './bookOrder';

/**
 * 1. out of the library (the book disappears from the UI even if a later step crashes);
 * 2. every `abk:book:{id}:*` key, found by prefix, so nothing is orphaned (progress, parts…);
 * 3. the PDF. Each step is idempotent, so a repeated delete finishes an interrupted one.
 */
export const deleteBook = async (
  stores: { kv: KeyValueStore; files: FileStore },
  id: BookId,
): Promise<void> => {
  const { kv, files } = stores;
  const order = await readOrder(kv);
  if (order.includes(id)) {
    await kv.setMany(orderEntry(withoutBook(order, id)));
  }
  const prefix = bookPrefix(id);
  const keys = (await kv.getAllKeys()).filter(key => key.startsWith(prefix));
  await kv.removeMany(keys);
  await files.remove(files.bookPdfPath(id));
};
