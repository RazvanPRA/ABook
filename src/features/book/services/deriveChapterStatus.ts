import type { Chapter, Progress } from '@/shared/domain';

export type ChapterStatus = 'done' | 'current' | 'pending';

/** Where a chapter is relative to the listening position; a finished book has only done chapters. */
export function deriveChapterStatus(
  { index }: Pick<Chapter, 'index'>,
  progress: Progress | null,
): ChapterStatus {
  if (progress === null) {
    return 'pending';
  }
  if (progress.finished || index < progress.chapter) {
    return 'done';
  }
  return index === progress.chapter ? 'current' : 'pending';
}
