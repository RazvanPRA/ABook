import type { BookMeta, Progress } from '@/shared/domain';

/**
 * What the library says about a book. `processing` and `failed` are about the import and win over
 * listening; the rest come from the progress.
 */
export type BookListStatus =
  'processing' | 'failed' | 'unstarted' | 'reading' | 'finished';

/** A book and where listening stopped; `null` when it was never played. */
export interface BookWithProgress {
  readonly book: BookMeta;
  readonly progress: Progress | null;
}
