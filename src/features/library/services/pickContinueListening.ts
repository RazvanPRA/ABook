import type { BookMeta, Progress } from '@/shared/domain';
import type { BookWithProgress } from '../model/types';

export interface ContinueListening {
  readonly book: BookMeta;
  readonly progress: Progress;
}

/**
 * The book of the "Continuă ascultarea" card: the last played one that isn't finished. A book whose
 * import runs or failed counts too, since its saved chapters are playable. `null` when there is none.
 */
export function pickContinueListening(
  byLastPlayed: readonly BookWithProgress[],
): ContinueListening | null {
  for (const { book, progress } of byLastPlayed) {
    if (progress !== null && !progress.finished) {
      return { book, progress };
    }
  }
  return null;
}
