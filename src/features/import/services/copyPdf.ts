import type { StoredPdf } from '@/repositories';
import type { BookId } from '@/shared/domain';
import type { ImportContext } from '../model/dependencies';
import type { PickedFile } from '../model/types';
import {
  duplicateFound,
  fileCopied,
  importStarted,
} from '../state/importSlice';
import { throwIfCancelled } from './cancellation';

export interface CopiedPdf {
  readonly bookId: BookId;
  readonly stored: StoredPdf;
  /** A book already in the library has the same fingerprint: the user decides. */
  readonly duplicate: boolean;
}

/**
 * Starts an import: a new book id, the app's copy of the file (fingerprinted by the repository),
 * then the duplicate check against the library. Nothing is in the library yet at this point.
 */
export async function copyPdf(
  context: ImportContext,
  file: PickedFile,
): Promise<CopiedPdf> {
  const { bookRepository, dispatch } = context;
  const bookId = context.newBookId();
  dispatch(importStarted({ bookId, file }));
  const stored = await bookRepository.storePdf(bookId, file.uri);
  throwIfCancelled(context);
  const existing = (await bookRepository.listBooks()).find(
    book => book.fingerprint === stored.fingerprint,
  );
  if (existing) {
    dispatch(duplicateFound({ existingBookId: existing.id, stored }));
    return { bookId, stored, duplicate: true };
  }
  dispatch(fileCopied(stored));
  return { bookId, stored, duplicate: false };
}
