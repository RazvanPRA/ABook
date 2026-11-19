import { normalizeWhitespace } from './normalizeWhitespace';
import type { PageLine, PageText } from './types';

/** A heading line is at least this much taller than the body text. */
export const HEADING_SCALE = 1.15;

/** Headings are short lines. */
const MAX_HEADING_CHARS = 60;

/** `Capitolul …`, `Partea …`, `Cartea …` in any case, or a Roman numeral alone (`IV`, `XII.`). */
const HEADING_PATTERN = /^(?:(?:capitolul|partea|cartea)\b|[IVXLC]+\.?$)/i;

/** Uppercase only for the Roman numeral: `vi` or `cel` alone is a word, not a heading. */
const ROMAN_ONLY = /^[ivxlc]+\.?$/i;

export function isHeadingLine(line: PageLine, bodyHeight: number): boolean {
  const text = normalizeWhitespace(line.text);
  return (
    text.length > 0 &&
    text.length <= MAX_HEADING_CHARS &&
    line.height > bodyHeight * HEADING_SCALE &&
    HEADING_PATTERN.test(text) &&
    (!ROMAN_ONLY.test(text) || text === text.toUpperCase())
  );
}

/**
 * The chapter heading on this page, if any: the first line that is short, taller than the body text
 * (`bodyHeight`, see `medianLineHeight`) and starts like a heading. A tall line right after it (the
 * chapter's name under `Capitolul I`) is added to the title: `Capitolul I — Glasul pământului`.
 */
export function findChapterHeading(
  page: PageText,
  bodyHeight: number,
): string | null {
  const index = page.lines.findIndex(line => isHeadingLine(line, bodyHeight));
  const heading = page.lines[index];
  if (!heading) {
    return null;
  }
  const next = page.lines[index + 1];
  const subtitle =
    next &&
    next.height > bodyHeight * HEADING_SCALE &&
    normalizeWhitespace(next.text).length <= MAX_HEADING_CHARS
      ? normalizeWhitespace(next.text)
      : '';
  const title = normalizeWhitespace(heading.text);
  return subtitle === '' ? title : `${title} — ${subtitle}`;
}
