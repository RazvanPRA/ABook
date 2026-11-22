import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { bookRemoved } from '@/features/library';
import { toBookId, type BookMeta } from '@/shared/domain';
import { logger } from '@/shared/utils';
import type { ImportContext, ImportDependencies } from '../model/dependencies';
import { MAX_PDF_BYTES } from '../model/limits';
import { isActivePhase } from '../model/steps';
import type { PickedFile } from '../model/types';
import { failureReason } from '../services/failureReason';
import { resumeImport } from '../services/resumeImport';
import { importBook, runImport } from '../services/runImport';
import {
  duplicateKept,
  importCancelled,
  importFailed,
  importStarted,
} from './importSlice';
import type { ImportRootState } from './selectors';

type ImportThunk = ThunkAction<
  Promise<void>,
  ImportRootState,
  ImportDependencies,
  UnknownAction
>;
type Dispatch = Parameters<ImportThunk>[0];
type GetState = Parameters<ImportThunk>[1];

/** A macrotask, so React can render between two chapters' cleanup and segmentation. */
const yieldToJs = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

function createContext(
  dispatch: Dispatch,
  getState: GetState,
  extra: ImportDependencies,
): ImportContext {
  return {
    bookRepository: extra.bookRepository,
    pdfExtractor: extra.pdfExtractor,
    dispatch,
    getForm: () => getState().import.form,
    isCancelled: () => getState().import.phase.type === 'cancelled',
    newBookId: () => toBookId(uuidv4()),
    now: () => new Date(),
    yieldToJs,
  };
}

/** Takes the book out of the library and storage (keys and file); never throws. */
async function removeImportedBook(
  dispatch: Dispatch,
  getState: GetState,
  extra: ImportDependencies,
): Promise<void> {
  const { bookId } = getState().import;
  if (bookId === null) {
    return;
  }
  try {
    await extra.bookRepository.deleteBook(bookId);
  } catch (error) {
    logger.warn('import: cleanup failed', error);
  }
  dispatch(bookRemoved(bookId));
}

/**
 * Runs pipeline work; on any error (a failure, or the stop after a cancel) records why, unless
 * cancelled, and removes everything the import wrote. Cleaning up here, once the pipeline has
 * stopped, means no write can land after the delete. The extractor is always closed.
 */
async function guarded(
  {
    dispatch,
    getState,
    extra,
  }: { dispatch: Dispatch; getState: GetState; extra: ImportDependencies },
  work: (context: ImportContext) => Promise<unknown>,
): Promise<void> {
  try {
    await work(createContext(dispatch, getState, extra));
  } catch (error) {
    const { phase } = getState().import;
    if (phase.type !== 'cancelled') {
      logger.warn('import failed', error);
      dispatch(importFailed(failureReason(error, phase.type)));
    }
    await removeImportedBook(dispatch, getState, extra);
  } finally {
    await extra.pdfExtractor.close();
  }
}

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
    await guarded({ dispatch, getState, extra }, context =>
      importBook(context, { bookId, stored }),
    );
  };

/**
 * Resumes, one after the other, the books a killed import left `processing` (the boot already
 * marked `failed` those without a PDF). A resumed import fails, or is cancelled, like a new one:
 * it removes the book. Stops when another import is running: the rest resume on the next boot.
 */
export const resumeImports =
  (books: readonly BookMeta[]): ImportThunk =>
  async (dispatch, getState, extra) => {
    for (const meta of books.filter(book => book.status === 'processing')) {
      if (isActivePhase(getState().import.phase)) {
        logger.warn('import: resume postponed, another import is running');
        return;
      }
      await guarded({ dispatch, getState, extra }, context =>
        resumeImport(context, meta),
      );
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
      await removeImportedBook(dispatch, getState, extra);
    } else {
      await extra.pdfExtractor.close();
    }
  };
