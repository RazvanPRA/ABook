// Built with `new RegExp` and double escapes: Prettier 3.10 turns `\uXXXX` in regex literals into the
// literal (here invisible) characters.

/** Soft hyphen and zero-width characters (ZWSP, ZWNJ, ZWJ, word joiner, BOM): removed. */
const INVISIBLE = new RegExp('[\\u00ad\\u200b-\\u200d\\u2060\\ufeff]', 'g');

/** Any run of whitespace: `\s` already covers NBSP, U+2000–U+200A, U+202F, U+205F and U+3000. */
const WHITESPACE_RUN = /\s+/g;

/**
 * Removes invisible characters and collapses every run of whitespace into one space, trimmed.
 * Run it after `joinHyphenatedWords`, which needs the soft hyphens at line ends.
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(INVISIBLE, '').replace(WHITESPACE_RUN, ' ').trim();
}
