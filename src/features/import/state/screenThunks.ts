import { bookUpserted } from '@/features/library';
import { logger } from '@/shared/utils';
import { isActivePhase } from '../model/steps';
import { formPatch } from '../services/formPatch';
import { importSubmitted } from './importSlice';
import { waitForPipeline, type ImportThunk } from './pipelineRunner';
import { cancelImport, importPdf } from './thunks';

/**
 * "Alege PDF" and "Schimbă": opens the system picker and imports the chosen PDF. Closing the
 * picker changes nothing. Another import running is cancelled first, and the new one starts only
 * once the old pipeline has stopped and cleaned up.
 */
export const pickPdf = (): ImportThunk => async (dispatch, getState, extra) => {
  let picked;
  try {
    picked = await extra.pdfPicker.pickPdf();
  } catch (error) {
    logger.warn('import: the picker failed', error);
    return;
  }
  if (picked === null) {
    return;
  }
  if (isActivePhase(getState().import.phase)) {
    await dispatch(cancelImport());
  }
  await waitForPipeline(extra);
  await dispatch(importPdf(picked));
};

/**
 * "Adaugă în bibliotecă": marks the form submitted (the screen closes). While the import runs, the
 * pipeline writes the form with every chapter and at the end; once it is over, it is written here.
 */
export const submitImport =
  (): ImportThunk => async (dispatch, getState, extra) => {
    dispatch(importSubmitted());
    const { submitted, phase, bookId, form } = getState().import;
    if (!submitted || phase.type !== 'ready' || bookId === null) {
      return;
    }
    try {
      const meta = await extra.bookRepository.updateMeta(
        bookId,
        formPatch(form),
      );
      if (meta) {
        dispatch(bookUpserted(meta));
      }
    } catch (error) {
      logger.warn('import: saving the book details failed', error);
    }
  };
