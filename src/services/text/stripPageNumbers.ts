import { isInBottomBand, isInPageBand } from './pageBands';
import type { PageLine, PageText } from './types';

/** Page numbers in Arabic digits, in either band: `12`, `- 12 -`, `12 / 300`, `12 din 300`, `pag. 12`. */
const ARABIC_PAGE_NUMBERS: readonly RegExp[] = [
  /^\d{1,4}$/,
  /^[-–—]\s*\d{1,4}\s*[-–—]$/,
  /^\d{1,4}\s*\/\s*\d{1,4}$/,
  /^\d{1,4}\s+din\s+\d{1,4}$/i,
  /^(pagina|pag\.|p\.)\s*\d{1,4}$/i,
];

/**
 * Roman page numbers (front matter), accepted only in the footer band: a lone `I` or `IV` at the top
 * of a page is far more often a chapter heading.
 */
const ROMAN_PAGE_NUMBER = /^[ivxlcdm]{1,7}$/i;

function isPageNumber(line: PageLine): boolean {
  const text = line.text.trim();
  if (isInBottomBand(line) && ROMAN_PAGE_NUMBER.test(text)) {
    return true;
  }
  return (
    isInPageBand(line) &&
    ARABIC_PAGE_NUMBERS.some(pattern => pattern.test(text))
  );
}

/**
 * Removes lines that are only a page number. Only the header and footer bands are checked, so a
 * number alone on a line in the body (a year, a list item) is kept.
 */
export function stripPageNumbers(pages: readonly PageText[]): PageText[] {
  return pages.map(page => ({
    page: page.page,
    lines: page.lines.filter(line => !isPageNumber(line)),
  }));
}
