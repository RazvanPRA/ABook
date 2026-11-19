import { bookOrderSchema, type BookId } from '@/shared/domain';
import { rootKey, type Entries, type KeyValueStore } from '@/storage';
import { readValue } from '../readValue';
import { serialize } from '../serialize';

const BOOKS_KEY = rootKey('books');

/** Library order; a missing or invalid `abk:books` is an empty library. */
export const readOrder = async (kv: KeyValueStore): Promise<BookId[]> =>
  (await readValue(kv, BOOKS_KEY, bookOrderSchema)) ?? [];

export const orderEntry = (ids: readonly BookId[]): Entries => ({
  [BOOKS_KEY]: serialize(BOOKS_KEY, ids),
});

/** New books go first: the library shows the latest import at the top. */
export const withBookFirst = (
  order: readonly BookId[],
  id: BookId,
): BookId[] => [id, ...order.filter(other => other !== id)];

export const withoutBook = (order: readonly BookId[], id: BookId): BookId[] =>
  order.filter(other => other !== id);
