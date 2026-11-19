/**
 * One line of text as the PDF extractor returns it.
 * `y` is the baseline's distance from the top of the page, as a fraction of the page height (0 = top,
 * 1 = bottom), so band checks don't need the page size. `height` is the font height in PDF units,
 * comparable between lines of the same document (used to recognize headings).
 */
export interface PageLine {
  readonly text: string;
  readonly y: number;
  readonly height: number;
}

/** The lines of one page, top to bottom. `page` is 1-based, as in the PDF. */
export interface PageText {
  readonly page: number;
  readonly lines: readonly PageLine[];
}
