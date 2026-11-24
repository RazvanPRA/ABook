import { v4 as uuidv4 } from 'uuid';
import { selectBookById } from '@/features/library';
import { toBookId, type BookMeta } from '@/shared/domain';
import { logger } from '@/shared/utils';
import { MAX_PDF_BYTES } from '../model/limits';
import { isActivePhase } from '../model/steps';
import type { PickedFile } from '../model/types';
import { resumeImport } from '../services/resumeImport';
import { importBook, runImport } from '../services/runImport';
import { isDiscarded } from './discardedBooks';
import {
  duplicateKept,
  importCancelled,
  importFailed,
  importStarted,
} from './importSlice';
import {
  guarded,
  removeImportedBook,
  type ImportThunk,
} from './pipelineRunner';

/**
 * Imports a picked PDF in the background: the screen dispatches it and only reads the import
 * slice. A file over 100 MB is refused before anything is copied.
 */
export const importPdf =
  (file: PickedFile): ImportThunk =>
  async (dispatch, getState, extra) => {
    if (file.sizeBytes > MAX_PDF_BYTES) {
      dispatch(importStarted({ bookId: toBookId(uuidv4()), file }));
      dispatch(importFailed('too-large'));
      return;
    }
    await guarded({ dispatch, getState, extra }, context =>
      runImport(context, file),
    );
  };

/** The user keeps a second copy of a book already in the library: the import goes on. */
export const keepDuplicate =
  (): ImportThunk => async (dispatch, getState, extra) => {
    const { phase, bookId, stored } = getState().import;
    if (phase.type !== 'duplicate' || bookId === null || stored === null) {
      logger.warn(`import: keepDuplicate ignored in phase ${phase.type}`);
      return;
    }
    dispatch(duplicateKept());
    await guarded(
      { dispatch, getState, extra },
      context => importBook(context, { bookId, stored }),
      bookId,
    );
  };

/**
 * Resumes, one after the other, the books a killed import left `processing` (the boot already
 * marked `failed` those without a PDF). Each is read again from the library when its turn comes: it
 * may have been deleted meanwhile. A cancel removes the book, a failure keeps it. Stops when
 * another import is running or the user cancelled (they may be picking another file): the rest
 * resume on the next boot. A cancel because the book is being deleted doesn't stop the others.
 */
export const resumeImports =
  (books: readonly BookMeta[]): ImportThunk =>
  async (dispatch, getState, extra) => {
    for (const { id } of books.filter(book => book.status === 'processing')) {
      const meta = selectBookById(getState(), id);
      if (meta?.status !== 'processing' || isDiscarded(extra, id)) {
        continue;
      }
      if (isActivePhase(getState().import.phase)) {
        logger.warn('import: resume postponed, another import is running');
        return;
      }
      await guarded(
        { dispatch, getState, extra },
        context => resumeImport(context, meta),
        id,
      );
      const cancelled = getState().import.phase.type === 'cancelled';
      if (cancelled && !isDiscarded(extra, id)) {
        return;
      }
    }
  };

/**
 * Cancels the import. A running pipeline is stopped (pending extractor calls reject) and cleans up
 * itself; an import waiting on a duplicate has no pipeline running, so its copy is removed here.
 */
export const cancelImport =
  (): ImportThunk => async (dispatch, getState, extra) => {
    const waiting = getState().import.phase.type === 'duplicate';
    dispatch(importCancelled());
    if (getState().import.phase.type !== 'cancelled') {
      return;
    }
    if (waiting) {
      await removeImportedBook({ dispatch, getState, extra });
    } else {
      await extra.pdfExtractor.close();
    }
  };
