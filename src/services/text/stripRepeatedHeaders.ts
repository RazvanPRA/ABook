import { headerSignature, isInPageBand } from './pageBands';
import type { PageLine, PageText } from './types';

/**
 * Removes the header and footer lines found by `detectRepeatedHeaders`. Only lines in the top or
 * bottom band are compared, so the same words in the body of a page are kept.
 */
export function stripRepeatedHeaders(
  pages: readonly PageText[],
  headers: ReadonlySet<string>,
): PageText[] {
  const isHeader = (line: PageLine): boolean =>
    isInPageBand(line) && headers.has(headerSignature(line.text));
  return pages.map(page => ({
    page: page.page,
    lines: page.lines.filter(line => !isHeader(line)),
  }));
}
