import { isPdfExtractionError, type PdfErrorCode } from '@/services/pdf';
import { ImportError } from '../model/errors';
import type { ImportFailure, ImportPhaseType } from '../model/types';

const PDF_REASONS: Partial<Record<PdfErrorCode, ImportFailure>> = {
  password: 'password',
  corrupt: 'corrupt',
  timeout: 'timeout',
};

/**
 * Why the import stopped, for the screen: the pipeline's own reasons, then pdf.js's (password,
 * corrupt, timeout). Any other error is the copy's while copying, and storage's afterwards (the
 * text services are pure; what else fails is a repository write).
 */
export function failureReason(
  error: unknown,
  phase: ImportPhaseType,
): ImportFailure {
  if (error instanceof ImportError) {
    return error.reason;
  }
  if (isPdfExtractionError(error)) {
    return PDF_REASONS[error.code] ?? 'unknown';
  }
  return phase === 'copying' ? 'copy' : 'storage';
}
