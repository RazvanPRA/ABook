/** Failures reported by the WebView page. */
export const PAGE_ERROR_CODES = [
  'password',
  'corrupt',
  'not-open',
  'bad-request',
  'boot',
  'unknown',
] as const;

export type PageErrorCode = (typeof PAGE_ERROR_CODES)[number];

/**
 * Why an extraction failed: a page error, or a failure on the RN side of the bridge (`timeout`,
 * `cancelled`, `protocol` = an invalid or unexpected message).
 */
export type PdfErrorCode = PageErrorCode | 'timeout' | 'cancelled' | 'protocol';

export class PdfExtractionError extends Error {
  readonly code: PdfErrorCode;

  constructor(code: PdfErrorCode, message: string) {
    super(message);
    this.name = 'PdfExtractionError';
    this.code = code;
  }
}

export function isPdfExtractionError(
  error: unknown,
): error is PdfExtractionError {
  return error instanceof PdfExtractionError;
}
