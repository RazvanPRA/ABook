import type { BookMeta, Chapter } from '@/shared/domain';

/** Where a book's extraction (re)starts: after `fromPage`, with `toc` already saved. */
export interface ResumePoint {
  readonly fromPage: number;
  readonly toc: readonly Chapter[];
}

export const START: ResumePoint = { fromPage: 0, toc: [] };

/**
 * Each chapter is saved as chunk → toc → `processedPages`, so a crash can leave the toc one chapter
 * ahead of `processedPages`, never behind. Without a toc there is nothing to continue from (a toc
 * is written with every chapter), so the import restarts at page 1 and overwrites what it saved.
 */
export function resumePoint(
  meta: Pick<BookMeta, 'processedPages'>,
  toc: readonly Chapter[] | null,
): ResumePoint {
  if (toc === null) {
    return START;
  }
  const lastEnd = toc.at(-1)?.endPage ?? 0;
  return { fromPage: Math.max(meta.processedPages, lastEnd), toc };
}
