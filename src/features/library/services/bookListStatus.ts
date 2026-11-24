import type { BookListStatus, BookWithProgress } from '../model/types';

/** The status of a book in the library list. */
export function bookListStatus({
  book,
  progress,
}: BookWithProgress): BookListStatus {
  if (book.status !== 'ready') {
    return book.status;
  }
  if (progress === null) {
    return 'unstarted';
  }
  return progress.finished ? 'finished' : 'reading';
}
