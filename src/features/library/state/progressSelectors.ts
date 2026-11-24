import { createSelector } from '@reduxjs/toolkit';
import type { BookId, Progress } from '@/shared/domain';
import type { BookWithProgress } from '../model/types';
import {
  pickContinueListening,
  type ContinueListening,
} from '../services/pickContinueListening';
import { sortByLastPlayed } from '../services/sortByLastPlayed';
import type { LibraryProgressState } from './progressSlice';
import { selectBooksInOrder, type LibraryRootState } from './selectors';

/** The store must mount the progress slice at `libraryProgress`. */
export interface LibraryProgressRootState {
  libraryProgress: LibraryProgressState;
}

type RootState = LibraryRootState & LibraryProgressRootState;

export const selectProgressLoaded = (
  state: LibraryProgressRootState,
): boolean => state.libraryProgress.loaded;

/** `null` when the book was never played. */
export const selectBookProgress = (
  state: LibraryProgressRootState,
  id: BookId,
): Progress | null => state.libraryProgress.byBook[id] ?? null;

/** Memoized: last played first, then the library order. */
export const selectBooksByLastPlayed: (state: RootState) => BookWithProgress[] =
  createSelector(
    [
      selectBooksInOrder,
      (state: LibraryProgressRootState) => state.libraryProgress.byBook,
    ],
    (books, byBook) =>
      sortByLastPlayed(
        books.map(book => ({ book, progress: byBook[book.id] ?? null })),
      ),
  );

/** The book of the "Continuă ascultarea" card, if any. */
export const selectContinueListening: (
  state: RootState,
) => ContinueListening | null = createSelector(
  [selectBooksByLastPlayed],
  pickContinueListening,
);
