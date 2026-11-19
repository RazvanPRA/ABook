import { countBandSignatures, isInPageBand } from './pageBands';
import { stripNumberedRunningHeaders } from './stripNumberedRunningHeaders';
import { stripRepeatedHeaders } from './stripRepeatedHeaders';
import type { PageLine, PageText } from './types';

/** A band line repeated on this many pages of one chapter is that chapter's running head. */
export const MIN_CHAPTER_HEADER_PAGES = 3;

/**
 * Signatures of the band lines repeated on at least 3 pages of `chapterPages`, whatever the share:
 * a running head printed only on even (or odd) pages, or only within one chapter, never reaches
 * the 50% that `detectRepeatedHeaders` asks of the book sample.
 */
export function detectChapterHeaders(
  chapterPages: readonly PageText[],
): ReadonlySet<string> {
  const headers = new Set<string>();
  for (const [signature, count] of countBandSignatures(chapterPages)) {
    if (count >= MIN_CHAPTER_HEADER_PAGES) {
      headers.add(signature);
    }
  }
  return headers;
}

/** Where a line sits: position to 1/250 of the page and height to half a point. */
const slotOf = (line: PageLine): string =>
  `${Math.round(line.y * 250)}:${Math.round(line.height * 2)}`;

/**
 * The slots of the header lines already removed (`before` → `after`) that held one on at least 3
 * pages: where this chapter prints its running heads.
 */
export function headerSlots(
  before: readonly PageText[],
  after: readonly PageText[],
): ReadonlySet<string> {
  const counts = new Map<string, number>();
  before.forEach((page, index) => {
    const kept = new Set(after[index]?.lines);
    const slots = new Set(
      page.lines.filter(line => !kept.has(line)).map(slotOf),
    );
    slots.forEach(slot => counts.set(slot, (counts.get(slot) ?? 0) + 1));
  });
  return new Set(
    [...counts]
      .filter(([, count]) => count >= MIN_CHAPTER_HEADER_PAGES)
      .map(([slot]) => slot),
  );
}

/**
 * The per-chapter header rules, after the book-wide `stripRepeatedHeaders`:
 * 1. band lines carrying the printed page number (`stripNumberedRunningHeaders`);
 * 2. band lines repeated on 3+ pages of the chapter (`detectChapterHeaders`);
 * 3. band lines in the same slot (position and height) as the heads removed by 1–2 on 3+ pages,
 *    whatever their text: section titles used as running heads, each printed on a page or two.
 */
export function stripChapterRunningHeaders(
  chapterPages: readonly PageText[],
): PageText[] {
  const numbered = stripNumberedRunningHeaders(chapterPages);
  const repeated = stripRepeatedHeaders(
    numbered,
    detectChapterHeaders(numbered),
  );
  const slots = headerSlots(chapterPages, repeated);
  return repeated.map(page => ({
    page: page.page,
    lines: page.lines.filter(
      line => !isInPageBand(line) || !slots.has(slotOf(line)),
    ),
  }));
}
