import type { BookFilter, BookWithProgress } from '../model/types';
import { foldText } from './foldText';

/** "În curs": started and not finished, or still being imported. "Terminate": listened to the end. */
export function matchesFilter(
  { book, progress }: BookWithProgress,
  filter: BookFilter,
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'reading':
      return (
        book.status === 'processing' ||
        (progress !== null && !progress.finished)
      );
    case 'finished':
      return progress?.finished === true;
  }
}

/**
 * The books that match the filter and contain every word of the query in their title or author,
 * whatever the case and diacritics. The order is kept.
 */
export function filterBooks(
  items: readonly BookWithProgress[],
  { query, filter }: { query: string; filter: BookFilter },
): BookWithProgress[] {
  const words = foldText(query)
    .split(/\s+/)
    .filter(word => word !== '');
  return items.filter(item => {
    if (!matchesFilter(item, filter)) {
      return false;
    }
    const text = foldText(`${item.book.title} ${item.book.author}`);
    return words.every(word => text.includes(word));
  });
}
