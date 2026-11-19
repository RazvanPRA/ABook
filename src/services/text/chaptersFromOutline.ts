import { type ChapterRange, rangesFromStarts } from './chapterRanges';
import { normalizeWhitespace } from './normalizeWhitespace';

/** An entry of the PDF outline (bookmarks), with its destination already resolved to a page. */
export interface OutlineItem {
  readonly title: string;
  /** 1-based page, or `null` when the destination couldn't be resolved. */
  readonly page: number | null;
  readonly items: readonly OutlineItem[];
}

/** An outline with fewer usable entries than this doesn't describe chapters. */
const MIN_OUTLINE_CHAPTERS = 2;

/**
 * Chapter ranges from the PDF outline: the top-level entries, or, when the top level has fewer than
 * two usable entries (a single "Cuprins" root, for example), the level below. `null` when neither
 * level has two entries with a page inside the book, so the caller falls back to headings.
 */
export function chaptersFromOutline(
  outline: readonly OutlineItem[],
  pageCount: number,
): ChapterRange[] | null {
  for (const level of [outline, outline.flatMap(item => item.items)]) {
    const starts = level.flatMap(item =>
      item.page !== null && item.page >= 1 && item.page <= pageCount
        ? [{ title: normalizeWhitespace(item.title), page: item.page }]
        : [],
    );
    if (new Set(starts.map(start => start.page)).size >= MIN_OUTLINE_CHAPTERS) {
      return rangesFromStarts(starts, pageCount);
    }
  }
  return null;
}
