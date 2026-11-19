import { type ChapterRange, rangesFromStarts } from './chapterRanges';

/** Fallback chapter length when the PDF has neither an outline nor headings. */
export const PAGES_PER_FIXED_CHAPTER = 10;

/** Chapters of `pagesPerChapter` pages each (the last one shorter), with empty titles. */
export function fixedPageChapters(
  pageCount: number,
  pagesPerChapter = PAGES_PER_FIXED_CHAPTER,
): ChapterRange[] {
  const size = Math.max(1, Math.floor(pagesPerChapter));
  const count = Math.ceil(Math.max(0, pageCount) / size);
  const starts = Array.from({ length: count }, (_, index) => ({
    title: '',
    page: index * size + 1,
  }));
  return rangesFromStarts(starts, pageCount);
}
