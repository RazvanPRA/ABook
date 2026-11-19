import type { BookId, BookMeta } from '@/shared/domain';
import { booksAdapter, type LibraryState } from './booksSlice';

/** The part of the root state this feature reads; the app's store must mount it at `library`. */
export interface LibraryRootState {
  library: LibraryState;
}

const selectors = booksAdapter.getSelectors(
  (state: LibraryRootState) => state.library,
);

/** Memoized: the same array until the library changes. */
export const selectBooksInOrder: (state: LibraryRootState) => BookMeta[] =
  selectors.selectAll;

export const selectBookById = (
  state: LibraryRootState,
  id: BookId,
): BookMeta | null => selectors.selectById(state, id) ?? null;

export const selectBookCount: (state: LibraryRootState) => number =
  selectors.selectTotal;
