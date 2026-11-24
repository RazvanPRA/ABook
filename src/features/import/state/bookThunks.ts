import {
  bookUpserted,
  selectBookById,
  type LibraryRootState,
} from '@/features/library';
import {
  isRetryableFailure,
  type BookId,
  type BookMeta,
} from '@/shared/domain';
import { logger } from '@/shared/utils';
import type { BookMetaPatch } from '@/repositories';
import { isActivePhase } from '../model/steps';
import { resumeImport } from '../services/resumeImport';
import { discardBook, isDiscarded } from './discardedBooks';
import {
  guarded,
  waitForBook,
  type ImportThunk,
  type ThunkApi,
} from './pipelineRunner';
import { cancelImport } from './thunks';

/**
 * Before a book is deleted: stops its import, if it has one, waits until the pipeline has cleaned
 * up, and keeps any other import of the book from starting. Other books' imports go on.
 */
export const cancelImportOf =
  (bookId: BookId): ImportThunk =>
  async (dispatch, getState, extra) => {
    discardBook(extra, bookId);
    const { phase, bookId: importing } = getState().import;
    if (importing === bookId && isActivePhase(phase)) {
      await dispatch(cancelImport());
    }
    await waitForBook({ dispatch, getState, extra }, bookId);
  };

/** The book, if its import can be continued now. */
function continuable(
  state: LibraryRootState,
  extra: ThunkApi['extra'],
  bookId: BookId,
): BookMeta | null {
  const book = selectBookById(state, bookId);
  if (book === null || isDiscarded(extra, bookId)) {
    return null;
  }
  return book.status === 'processing' || isRetryableFailure(book) ? book : null;
}

async function patchBook(
  { dispatch, extra }: ThunkApi,
  bookId: BookId,
  patch: BookMetaPatch,
): Promise<BookMeta | null> {
  const meta = await extra.bookRepository.updateMeta(bookId, patch);
  if (meta) {
    dispatch(bookUpserted(meta));
  }
  return meta;
}

/**
 * "Reia importul" / "Reîncearcă": continues a stalled (`processing`, nothing running) or retryable
 * failed book from where it stopped. Without its PDF the book becomes `failed` (`missing-file`).
 * Ignored while another import runs.
 */
export const continueImport =
  (bookId: BookId): ImportThunk =>
  async (dispatch, getState, extra) => {
    const api = { dispatch, getState, extra };
    if (isActivePhase(getState().import.phase)) {
      logger.warn('import: continue ignored, another import is running');
      return;
    }
    await guarded(
      api,
      async context => {
        const book = continuable(getState(), extra, bookId);
        if (book === null) {
          return;
        }
        if (!(await extra.bookRepository.hasPdf(book))) {
          await patchBook(api, bookId, {
            status: 'failed',
            failure: 'missing-file',
          });
          return;
        }
        const meta =
          book.status === 'processing'
            ? book
            : await patchBook(api, bookId, {
                status: 'processing',
                failure: null,
              });
        if (meta) {
          await resumeImport(context, meta);
        }
      },
      bookId,
    );
  };
