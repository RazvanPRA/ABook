import {
  createEntityAdapter,
  createSlice,
  type EntityState,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { BookId, BookMeta } from '@/shared/domain';

/** Books by id; `ids` keeps the library order. Source data only, as stored. */
export const booksAdapter = createEntityAdapter<BookMeta, BookId>({
  selectId: book => book.id,
});

export type LibraryState = EntityState<BookMeta, BookId>;

const booksSlice = createSlice({
  name: 'library',
  initialState: booksAdapter.getInitialState(),
  reducers: {
    /** Bootstrap: replaces everything with the stored library, in library order. */
    libraryHydrated: (state, action: PayloadAction<readonly BookMeta[]>) => {
      booksAdapter.setAll(state, action.payload);
    },
    /** A new book goes first (as in storage); a known one is replaced in place. */
    bookUpserted: (state, action: PayloadAction<BookMeta>) => {
      const book = action.payload;
      const isNew = state.entities[book.id] === undefined;
      booksAdapter.setOne(state, book);
      if (isNew) {
        state.ids = [book.id, ...state.ids.filter(id => id !== book.id)];
      }
    },
    bookRemoved: (state, action: PayloadAction<BookId>) => {
      booksAdapter.removeOne(state, action.payload);
    },
  },
});

export const { libraryHydrated, bookUpserted, bookRemoved } =
  booksSlice.actions;
export const libraryReducer = booksSlice.reducer;
