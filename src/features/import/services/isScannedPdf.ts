import type { PageText } from '@/services/text';
import { SCANNED_MIN_CHARS, SCANNED_SAMPLE_PAGES } from '../model/limits';

const characters = (page: PageText): number =>
  page.lines.reduce((sum, line) => sum + line.text.trim().length, 0);

/**
 * PROMPT §5: a PDF without a text layer (a scan) has fewer than 20 characters on **each** of its
 * first 5 pages. One page with text is enough to import: a book often opens with blank or
 * image-only pages (`The.Clean.Coder…pdf`: 0, 1520, 30, 13, 443 characters).
 */
export function isScannedPdf(firstPages: readonly PageText[]): boolean {
  const sample = firstPages.slice(0, SCANNED_SAMPLE_PAGES);
  return (
    sample.length > 0 &&
    sample.every(page => characters(page) < SCANNED_MIN_CHARS)
  );
}
