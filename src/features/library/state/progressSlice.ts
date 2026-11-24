import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ProgressByBook } from '@/repositories';
import type { BookId, Progress } from '@/shared/domain';
import { bookRemoved } from './booksSlice';

export interface LibraryProgressState {
  /** `null`: started over since the boot. Books never played are missing. */
  byBook: Partial<Record<BookId, Progress | null>>;
  /** The stored progress was read (or could not be): the library can show its list. */
  loaded: boolean;
}

const initialState: LibraryProgressState = { byBook: {}, loaded: false };

const progressSlice = createSlice({
  name: 'libraryProgress',
  initialState,
  reducers: {
    /** The stored progress, read after boot; what changed meanwhile is newer and stays. */
    progressLoaded: (state, action: PayloadAction<ProgressByBook>) => {
      state.byBook = { ...action.payload, ...state.byBook };
      state.loaded = true;
    },
    /** Where listening is now; `null` starts the book over. */
    progressChanged: (
      state,
      action: PayloadAction<{ bookId: BookId; progress: Progress | null }>,
    ) => {
      const { bookId, progress } = action.payload;
      state.byBook[bookId] = progress;
    },
  },
  extraReducers: builder => {
    builder.addCase(bookRemoved, (state, action) => {
      delete state.byBook[action.payload];
    });
  },
});

export const { progressLoaded, progressChanged } = progressSlice.actions;
export const libraryProgressReducer = progressSlice.reducer;
