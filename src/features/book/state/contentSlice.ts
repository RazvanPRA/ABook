import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { bookRemoved } from '@/features/library';
import type { BookId, Bookmark, Chapter } from '@/shared/domain';

export interface BookContent {
  /** The newest read of this book: an older answer that comes later is ignored. */
  request: string;
  /** `false` until the first answer. */
  loaded: boolean;
  toc: Chapter[];
  bookmarks: Bookmark[];
}

/** What the details screen shows of the books opened so far. */
export type BookContentState = Partial<Record<BookId, BookContent>>;

/** The store must mount the slice at `bookContent`. */
export interface BookContentRootState {
  bookContent: BookContentState;
}

const initialState: BookContentState = {};

const contentSlice = createSlice({
  name: 'bookContent',
  initialState,
  reducers: {
    contentRequested: (
      state,
      action: PayloadAction<{ bookId: BookId; request: string }>,
    ) => {
      const { bookId, request } = action.payload;
      state[bookId] = {
        ...(state[bookId] ?? { loaded: false, toc: [], bookmarks: [] }),
        request,
      };
    },
    /** Ignored when a newer read started, or the book was removed meanwhile. */
    contentLoaded: (
      state,
      action: PayloadAction<{
        bookId: BookId;
        request: string;
        toc: Chapter[];
        bookmarks: Bookmark[];
      }>,
    ) => {
      const { bookId, request, toc, bookmarks } = action.payload;
      if (state[bookId]?.request === request) {
        state[bookId] = { request, loaded: true, toc, bookmarks };
      }
    },
    bookmarksChanged: (
      state,
      action: PayloadAction<{ bookId: BookId; bookmarks: Bookmark[] }>,
    ) => {
      const content = state[action.payload.bookId];
      if (content) {
        content.bookmarks = action.payload.bookmarks;
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(bookRemoved, (state, action) => {
      delete state[action.payload];
    });
  },
});

export const { contentRequested, contentLoaded, bookmarksChanged } =
  contentSlice.actions;
export const bookContentReducer = contentSlice.reducer;

/** `null` until the first read of the book answered. */
export const selectBookContent = (
  state: BookContentRootState,
  id: BookId,
): BookContent | null => {
  const content = state.bookContent[id];
  return content?.loaded ? content : null;
};
