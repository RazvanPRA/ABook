import type { PageLine, PageText } from '../types';

/** Body text height used by the samples; headings use a larger value. */
export const BODY_HEIGHT = 10;

/** A line in the middle of the page unless `y` says otherwise. */
export function line(text: string, y = 0.5, height = BODY_HEIGHT): PageLine {
  return { text, y, height };
}

export function page(number: number, ...lines: PageLine[]): PageText {
  return { page: number, lines };
}

/** Running header of the sample book (top band). */
export const BOOK_HEADER = 'ION — Liviu Rebreanu';

/**
 * A typical printed page of the sample book: the book header at the top, two body lines and the page
 * number in the footer.
 */
export function bookPage(number: number, ...body: string[]): PageText {
  return page(
    number,
    line(BOOK_HEADER, 0.04),
    ...body.map((text, index) => line(text, 0.2 + index * 0.05)),
    line(String(number), 0.96),
  );
}

/** Only the texts of each page, for compact assertions. */
export function texts(pages: readonly PageText[]): string[][] {
  return pages.map(entry => entry.lines.map(item => item.text));
}
