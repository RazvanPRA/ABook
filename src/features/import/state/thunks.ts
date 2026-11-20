import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { toBookId } from '@/shared/domain';
import { logger } from '@/shared/utils';
import type { ImportContext, ImportDependencies } from '../model/dependencies';
import type { PickedFile } from '../model/types';
import { runImport } from '../services/runImport';
import { importFailed } from './importSlice';
import type { ImportRootState } from './selectors';

type ImportThunk = ThunkAction<
  Promise<void>,
  ImportRootState,
  ImportDependencies,
  UnknownAction
>;

/** A macrotask, so React can render between two chapters' cleanup and segmentation. */
const yieldToJs = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

/**
 * Imports a picked PDF in the background: the screen dispatches it and only reads the import
 * slice. The extractor is always closed at the end, so the hidden WebView goes away.
 */
export const importPdf =
  (file: PickedFile): ImportThunk =>
  async (dispatch, getState, extra) => {
    const context: ImportContext = {
      bookRepository: extra.bookRepository,
      pdfExtractor: extra.pdfExtractor,
      dispatch,
      getForm: () => getState().import.form,
      newBookId: () => toBookId(uuidv4()),
      now: () => new Date(),
      yieldToJs,
    };
    try {
      await runImport(context, file);
    } catch (error) {
      // Step 14 maps the error to its reason and removes the book's keys and file
      logger.warn('import failed', error);
      dispatch(importFailed('unknown'));
    } finally {
      await extra.pdfExtractor.close();
    }
  };
