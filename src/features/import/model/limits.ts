/** Largest PDF the picker accepts (PROMPT §5: configurable, 100 MB by default). */
export const MAX_PDF_BYTES = 100 * 1024 * 1024;

/** A PDF is taken for scanned when each of its first 5 pages has fewer than 20 characters. */
export const SCANNED_SAMPLE_PAGES = 5;
export const SCANNED_MIN_CHARS = 20;
