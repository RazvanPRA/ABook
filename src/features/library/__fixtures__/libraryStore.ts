import { configureStore } from '@reduxjs/toolkit';
import type { ProgressByBook, ProgressRepository } from '@/repositories';
import type { BookId, BookMeta } from '@/shared/domain';
import { libraryHydrated, libraryReducer } from '../state/booksSlice';
import { libraryProgressReducer } from '../state/progressSlice';

/** The library slices over a progress repository whose `listProgress` is a mock. */
export function createLibraryStore(
  books: readonly BookMeta[] = [],
  stored: ProgressByBook = {},
) {
  const listProgress = jest.fn(
    async (_ids: readonly BookId[]): Promise<ProgressByBook> => stored,
  );
  const progressRepository: ProgressRepository = {
    listProgress,
    getProgress: async () => null,
    saveProgress: async () => undefined,
    getBookmarks: async () => [],
    saveBookmarks: async () => undefined,
  };
  const store = configureStore({
    reducer: {
      library: libraryReducer,
      libraryProgress: libraryProgressReducer,
    },
    middleware: getDefault =>
      getDefault({ thunk: { extraArgument: { progressRepository } } }),
  });
  store.dispatch(libraryHydrated(books));
  return { store, listProgress };
}
