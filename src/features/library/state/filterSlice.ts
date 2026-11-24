import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { BookFilter, BookWithProgress } from '../model/types';
import { filterBooks } from '../services/filterBooks';
import {
  selectBooksByLastPlayed,
  type LibraryProgressRootState,
} from './progressSelectors';
import type { LibraryRootState } from './selectors';

export interface LibraryFilterState {
  query: string;
  filter: BookFilter;
}

/** The store must mount the slice at `libraryFilter`. */
export interface LibraryFilterRootState {
  libraryFilter: LibraryFilterState;
}

const initialState: LibraryFilterState = { query: '', filter: 'all' };

const filterSlice = createSlice({
  name: 'libraryFilter',
  initialState,
  reducers: {
    queryChanged: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    filterChanged: (state, action: PayloadAction<BookFilter>) => {
      state.filter = action.payload;
    },
  },
});

export const { queryChanged, filterChanged } = filterSlice.actions;
export const libraryFilterReducer = filterSlice.reducer;

export const selectLibraryFilter = (
  state: LibraryFilterRootState,
): LibraryFilterState => state.libraryFilter;

type RootState = LibraryRootState &
  LibraryProgressRootState &
  LibraryFilterRootState;

/** Memoized: what the list shows, last played first. */
export const selectVisibleBooks: (state: RootState) => BookWithProgress[] =
  createSelector([selectBooksByLastPlayed, selectLibraryFilter], filterBooks);
