import type { PageLine } from './types';

/** Height of the top and of the bottom band of a page, as a fraction of the page height. */
export const PAGE_BAND = 0.1;

/** The line sits in the header band (top 10% of the page). */
export function isInTopBand(line: PageLine): boolean {
  return line.y < PAGE_BAND;
}

/** The line sits in the footer band (bottom 10% of the page). */
export function isInBottomBand(line: PageLine): boolean {
  return line.y > 1 - PAGE_BAND;
}

/** The line sits in the header or the footer band. */
export function isInPageBand(line: PageLine): boolean {
  return isInTopBand(line) || isInBottomBand(line);
}

/**
 * Comparison key for a header/footer line: whitespace collapsed, digits replaced and case folded,
 * so "Ion — pagina 12" and "ION — pagina 13" count as the same line.
 */
export function headerSignature(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/\d+/g, '#').toLowerCase();
}
