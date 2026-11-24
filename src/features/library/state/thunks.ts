import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import type { AppDependencies, ProgressByBook } from '@/repositories';
import { logger } from '@/shared/utils';
import type { LibraryProgressRootState } from './progressSelectors';
import { progressLoaded } from './progressSlice';
import { selectBooksInOrder, type LibraryRootState } from './selectors';

export type LibraryThunk = ThunkAction<
  Promise<void>,
  LibraryRootState & LibraryProgressRootState,
  Pick<AppDependencies, 'progressRepository'>,
  UnknownAction
>;

/**
 * Reads every book's progress, once, right after hydration (boot itself doesn't: storage rule 8).
 * Never rejects: if it can't be read, the library shows its books as never played.
 */
export const loadLibraryProgress =
  (): LibraryThunk => async (dispatch, getState, extra) => {
    const ids = selectBooksInOrder(getState()).map(book => book.id);
    let stored: ProgressByBook = {};
    try {
      stored = await extra.progressRepository.listProgress(ids);
    } catch (error) {
      logger.warn('library: reading the progress failed', error);
    }
    // A book deleted during the read must not come back
    const { entities } = getState().library;
    const present = ids.filter(id => entities[id] && stored[id]);
    dispatch(
      progressLoaded(Object.fromEntries(present.map(id => [id, stored[id]]))),
    );
  };
