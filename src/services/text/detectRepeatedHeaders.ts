import { countBandSignatures } from './pageBands';
import type { PageText } from './types';

/** Pages read at the start of an import to learn the headers and footers (decision in M3-import.md). */
export const HEADER_SAMPLE_PAGES = 20;

/** A band line is a header/footer when it repeats on at least this share of the sampled pages… */
export const HEADER_PAGE_RATIO = 0.5;

/** …and on at least this many pages, so a line seen once in a 2-page sample doesn't qualify. */
export const MIN_HEADER_PAGES = 2;

/**
 * Signatures (see `headerSignature`) of the header and footer lines in `sample`: lines in the top or
 * bottom band that repeat, digits aside, on ≥ 50% of the non-empty pages. Pass the result to
 * `stripRepeatedHeaders` for every page of the book.
 */
export function detectRepeatedHeaders(
  sample: readonly PageText[],
): ReadonlySet<string> {
  const pages = sample.filter(page => page.lines.length > 0);
  const threshold = Math.max(
    MIN_HEADER_PAGES,
    Math.ceil(pages.length * HEADER_PAGE_RATIO),
  );
  const repeated = new Set<string>();
  for (const [signature, count] of countBandSignatures(pages)) {
    if (count >= threshold) {
      repeated.add(signature);
    }
  }
  return repeated;
}
