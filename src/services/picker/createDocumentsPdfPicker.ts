import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';
import type { PdfPicker, PickedDocument } from './types';

/** Shown when the provider gives no name (rare: some cloud providers). */
export const FALLBACK_PDF_NAME = 'document.pdf';

type PickFn = typeof pick;

/**
 * `PdfPicker` over `@react-native-documents/picker` (import mode). The app copies the picked URI
 * into its own storage itself (`BookRepository.storePdf`), so no `keepLocalCopy` cache copy is
 * made. `pick` is injectable for tests.
 */
export function createDocumentsPdfPicker(pickFn: PickFn = pick): PdfPicker {
  return {
    pickPdf: async () => {
      try {
        const [file] = await pickFn({ type: [types.pdf] });
        return toPickedDocument(file);
      } catch (error) {
        if (
          isErrorWithCode(error) &&
          error.code === errorCodes.OPERATION_CANCELED
        ) {
          return null;
        }
        throw error;
      }
    },
  };
}

function toPickedDocument(
  file: { uri: string; name: string | null; size: number | null } | undefined,
): PickedDocument | null {
  if (!file) {
    return null;
  }
  return {
    name: file.name?.trim() || FALLBACK_PDF_NAME,
    uri: file.uri,
    sizeBytes: file.size ?? 0,
  };
}
