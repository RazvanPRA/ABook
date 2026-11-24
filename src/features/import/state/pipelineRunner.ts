import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  bookRemoved,
  bookUpserted,
  type LibraryRootState,
} from '@/features/library';
import { toBookId, type BookId } from '@/shared/domain';
import { logger } from '@/shared/utils';
import type { ImportContext, ImportDependencies } from '../model/dependencies';
import { ImportCancelledError } from '../model/errors';
import { isActivePhase } from '../model/steps';
import type { ImportFailure } from '../model/types';
import { failureReason } from '../services/failureReason';
import { isDiscarded } from './discardedBooks';
import { importFailed } from './importSlice';
import type { ImportRootState } from './selectors';

export type ImportThunk = ThunkAction<
  Promise<void>,
  ImportRootState & LibraryRootState,
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
    isDiscarded: id => isDiscarded(extra, id),
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

/** Failures that would come back on every retry: the file itself can't be imported. */
const PERMANENT = ['scanned', 'password', 'corrupt'] as const;

const isPermanent = (
  reason: ImportFailure,
): reason is (typeof PERMANENT)[number] =>
  (PERMANENT as readonly ImportFailure[]).includes(reason);

/**
 * A resumed book keeps what it has. A permanent failure marks it `failed`; after any other (the
 * WebView didn't start, a timeout, a full disk) it stays `processing` and the next boot retries.
 */
async function keepResumedBook(
  { dispatch, getState, extra }: ThunkApi,
  reason: ImportFailure,
): Promise<void> {
  const { bookId } = getState().import;
  if (bookId === null || !isPermanent(reason)) {
    return;
  }
  try {
    const meta = await extra.bookRepository.updateMeta(bookId, {
      status: 'failed',
      failure: reason,
    });
    if (meta) {
      dispatch(bookUpserted(meta));
    }
  } catch (error) {
    logger.warn('import: marking the book failed did not work', error);
  }
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

interface ActiveRun {
  readonly promise: Promise<void>;
  /** The book, when known before the work starts (not for a newly picked file). */
  readonly bookId: BookId | null;
}

/** The pipeline actually running, at the head of the queue. */
const active = new WeakMap<ImportDependencies, ActiveRun>();

/** Resolves once no pipeline works on the book, cleanup included; doesn't wait for other books. */
export async function waitForBook(
  { getState, extra }: ThunkApi,
  bookId: BookId,
): Promise<void> {
  const run = active.get(extra);
  if (run && (run.bookId ?? getState().import.bookId) === bookId) {
    await run.promise;
  }
}

/**
 * Runs pipeline work, after the pipeline already running, if any (one extractor, one slice). On any
 * error (a failure, or the stop after a cancel) records why, unless cancelled, and removes
 * everything the import wrote (a failed resume keeps it). Cleaning up here, once the pipeline has
 * stopped, means no write can land after the delete. The extractor is always closed.
 */
export async function guarded(
  api: ThunkApi,
  work: (context: ImportContext) => Promise<unknown>,
  bookId: BookId | null = null,
): Promise<void> {
  const previous = running.get(api.extra);
  const start = () => {
    const promise = runGuarded(api, work);
    active.set(api.extra, { promise, bookId });
    return promise;
  };
  const run = previous ? previous.then(start, start) : start();
  running.set(api.extra, run);
  try {
    await run;
  } finally {
    if (running.get(api.extra) === run) {
      running.delete(api.extra);
      active.delete(api.extra);
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
    await cleanUp(api, error);
  } finally {
    await api.extra.pdfExtractor.close();
  }
}

async function cleanUp(api: ThunkApi, error: unknown): Promise<void> {
  const { phase, resumed } = api.getState().import;
  if (phase.type === 'cancelled') {
    await removeImportedBook(api);
    return;
  }
  if (error instanceof ImportCancelledError && !isActivePhase(phase)) {
    return; // the book was deleted before its resume started: nothing to clean up
  }
  logger.warn('import failed', error);
  if (!isActivePhase(phase)) {
    return; // it failed before it started: the slice still describes an earlier import
  }
  const reason = failureReason(error, phase.type);
  api.dispatch(importFailed(reason));
  await (resumed ? keepResumedBook(api, reason) : removeImportedBook(api));
}
