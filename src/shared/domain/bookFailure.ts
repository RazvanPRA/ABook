import type { BookMeta } from './schemas';

/**
 * Whether a book's failure may go away when its import continues. A stored reason is about the file
 * itself and would come back; only an unknown one (failed before schema 3) is worth another try,
 * and only while the app's copy of the PDF is still there (`BookRepository.hasPdf`).
 */
export const isRetryableFailure = (
  book: Pick<BookMeta, 'status' | 'failure'>,
): boolean => book.status === 'failed' && book.failure === null;
