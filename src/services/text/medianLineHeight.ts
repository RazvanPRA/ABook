import type { PageText } from './types';

/**
 * The median height of the non-blank lines: the body text height, since body lines far outnumber
 * headings. 0 when there are no lines.
 */
export function medianLineHeight(pages: readonly PageText[]): number {
  const heights = pages
    .flatMap(page => page.lines)
    .filter(line => line.text.trim() !== '')
    .map(line => line.height)
    .sort((a, b) => a - b);
  if (heights.length === 0) {
    return 0;
  }
  const middle = Math.floor(heights.length / 2);
  const from = heights.length % 2 === 0 ? middle - 1 : middle;
  const values = heights.slice(from, middle + 1);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
