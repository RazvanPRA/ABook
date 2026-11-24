import type { BookMeta, Progress } from '@/shared/domain';
import { clamp } from '@/shared/utils';

/** Whole percent of the book listened to, by page (34 of 82 → 41); a finished book is 100. */
export function listenedPercent(
  { pageCount }: Pick<BookMeta, 'pageCount'>,
  progress: Progress | null,
): number {
  if (progress === null) {
    return 0;
  }
  if (progress.finished) {
    return 100;
  }
  return pageCount === 0
    ? 0
    : Math.round(clamp(progress.page / pageCount, 0, 1) * 100);
}
