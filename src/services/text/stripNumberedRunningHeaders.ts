import { isInPageBand } from './pageBands';
import type { PageText } from './types';

/** An offset is the book's page numbering only when this many pages agree on it. */
export const MIN_NUMBERED_HEADER_PAGES = 3;

const LEADING_NUMBER = /^(\d{1,4})(?!\d)/;
const TRAILING_NUMBER = /(?:^|\D)(\d{1,4})$/;

/** The numbers a band line starts or ends with: `72 CHAPTER 3 …`, `71Overview…`, `… page 9`. */
function edgeNumbers(text: string): number[] {
  const trimmed = text.trim();
  return [LEADING_NUMBER.exec(trimmed), TRAILING_NUMBER.exec(trimmed)].flatMap(
    match => (match?.[1] === undefined ? [] : [Number(match[1])]),
  );
}

/**
 * The offset between PDF pages and printed page numbers (`page − printed`), read from the numbers
 * that band lines start or end with: the offset most pages agree on, if at least 3 do; `null`
 * otherwise (no numbering in the bands, or too few pages to tell).
 */
export function printedPageOffset(pages: readonly PageText[]): number | null {
  const counts = new Map<number, number>();
  for (const { page, lines } of pages) {
    const offsets = new Set(
      lines
        .filter(isInPageBand)
        .flatMap(line => edgeNumbers(line.text).map(number => page - number)),
    );
    offsets.forEach(offset =>
      counts.set(offset, (counts.get(offset) ?? 0) + 1),
    );
  }
  let best: number | null = null;
  let bestCount = MIN_NUMBERED_HEADER_PAGES - 1;
  for (const [offset, count] of counts) {
    if (count > bestCount) {
      best = offset;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Removes header and footer lines that carry the printed page number at their start or end, such as
 * running heads that change with every chapter or section (`72 CHAPTER 3 Interprocess…`,
 * `71Overview of…`). The numbering is learned from the given pages (a chapter), so a line is only
 * removed when its number is that page's printed number; body lines are never touched.
 */
export function stripNumberedRunningHeaders(
  pages: readonly PageText[],
): PageText[] {
  const offset = printedPageOffset(pages);
  return pages.map(({ page, lines }) => ({
    page,
    lines:
      offset === null
        ? lines
        : lines.filter(
            line =>
              !isInPageBand(line) ||
              !edgeNumbers(line.text).includes(page - offset),
          ),
  }));
}
