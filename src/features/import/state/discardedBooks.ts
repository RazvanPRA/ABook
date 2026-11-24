import type { ImportDependencies } from '../model/dependencies';
import type { BookId } from '@/shared/domain';

/**
 * Books being deleted, for each store's dependencies. A delete takes a while (the book is still in
 * the store until storage is done), and no import of the book may start meanwhile: what it writes
 * would be left behind. Ids are never reused, so they are never taken out.
 */
const discarded = new WeakMap<ImportDependencies, Set<BookId>>();

export function discardBook(extra: ImportDependencies, id: BookId): void {
  const ids = discarded.get(extra) ?? new Set<BookId>();
  discarded.set(extra, ids.add(id));
}

export const isDiscarded = (extra: ImportDependencies, id: BookId): boolean =>
  discarded.get(extra)?.has(id) ?? false;
