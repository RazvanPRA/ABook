import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { bookRemoved } from '@/features/library';
import { toBookId } from '@/shared/domain';
import { logger } from '@/shared/utils';
import type { ImportContext, ImportDependencies } from '../model/dependencies';
import { failureReason } from '../services/failureReason';
import { importFailed } from './importSlice';
import type { ImportRootState } from './selectors';

export type ImportThunk = ThunkAction<
  Promise<void>,
  ImportRootState,
  ImportDependencies,
  UnknownAction
>;
type Dispatch = Parameters<ImportThunk>[0];
type GetState = Parameters<ImportThunk>[1];

export interface ThunkApi {
  dispatch: Dispatch;
  getState: GetState;
  extra: ImportDependencies;
}

/** A macrotask, so React can render between two chapters' cleanup and segmentation. */
const yieldToJs = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

function createContext({ dispatch, getState, extra }: ThunkApi): ImportContext {
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

/** Takes the import's book out of the library and storage (keys and file); never throws. */
export async function removeImportedBook({
  dispatch,
  getState,
  extra,
}: ThunkApi): Promise<void> {
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

/** The pipeline running for each store's dependencies (one at a time: one extractor). */
const running = new WeakMap<ImportDependencies, Promise<void>>();

/**
 * Resolves once no pipeline runs any more, cleanup included. A new import must wait for it after a
 * cancel: until then the old pipeline still reads the import slice to know it was cancelled.
 */
export async function waitForPipeline(
  extra: ImportDependencies,
): Promise<void> {
  await running.get(extra);
}

/**
 * Runs pipeline work; on any error (a failure, or the stop after a cancel) records why, unless
 * cancelled, and removes everything the import wrote. Cleaning up here, once the pipeline has
 * stopped, means no write can land after the delete. The extractor is always closed.
 */
export async function guarded(
  api: ThunkApi,
  work: (context: ImportContext) => Promise<unknown>,
): Promise<void> {
  const run = runGuarded(api, work);
  running.set(api.extra, run);
  try {
    await run;
  } finally {
    if (running.get(api.extra) === run) {
      running.delete(api.extra);
    }
  }
}

async function runGuarded(
  api: ThunkApi,
  work: (context: ImportContext) => Promise<unknown>,
): Promise<void> {
  try {
    await work(createContext(api));
  } catch (error) {
    const { phase } = api.getState().import;
    if (phase.type !== 'cancelled') {
      logger.warn('import failed', error);
      api.dispatch(importFailed(failureReason(error, phase.type)));
    }
    await removeImportedBook(api);
  } finally {
    await api.extra.pdfExtractor.close();
  }
}
