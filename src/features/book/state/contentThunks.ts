import { nanoid } from '@reduxjs/toolkit';
import { progressChanged, selectBookById } from '@/features/library';
import type { BookId } from '@/shared/domain';
import { logger } from '@/shared/utils';
import type { BookThunk } from '../model/dependencies';
import {
  bookmarksChanged,
  contentLoaded,
  contentRequested,
  selectBookContent,
} from './contentSlice';
import { selectDeletion } from './deletionSlice';

/** A read that failed is logged and shows as empty: the rest of the screen still works. */
async function attempt<T>(read: Promise<T>, fallback: T): Promise<T> {
  try {
    return await read;
  } catch (error) {
    logger.warn('book: reading the content failed', error);
    return fallback;
  }
}

/** Reads the book's table of contents and bookmarks; again as its import saves chapters. */
export const loadBookContent =
  (bookId: BookId): BookThunk =>
  async (dispatch, _getState, extra) => {
    const request = nanoid();
    dispatch(contentRequested({ bookId, request }));
    const [toc, bookmarks] = await Promise.all([
      attempt(extra.bookRepository.getToc(bookId), null),
      attempt(extra.progressRepository.getBookmarks(bookId), []),
    ]);
    dispatch(contentLoaded({ bookId, request, toc: toc ?? [], bookmarks }));
  };

/**
 * Removes a bookmark for good; if it can't be written, it comes back. Ignored for a book deleted,
 * or being deleted: the write would leave a key behind.
 */
export const removeBookmark =
  (bookId: BookId, bookmarkId: string): BookThunk =>
  async (dispatch, getState, extra) => {
    const state = getState();
    const content = selectBookContent(state, bookId);
    const writable =
      selectBookById(state, bookId) !== null &&
      selectDeletion(state, bookId) === null;
    if (content === null || !writable) {
      return;
    }
    const before = content.bookmarks;
    const bookmarks = before.filter(({ id }) => id !== bookmarkId);
    dispatch(bookmarksChanged({ bookId, bookmarks }));
    try {
      await extra.progressRepository.saveBookmarks(bookId, bookmarks);
    } catch (error) {
      logger.warn('book: removing a bookmark failed', error);
      dispatch(bookmarksChanged({ bookId, bookmarks: before }));
    }
  };

/** "Ascultă din nou": the book is as if never played. Returns whether it worked. */
export const resetProgress =
  (bookId: BookId): BookThunk<boolean> =>
  async (dispatch, _getState, extra) => {
    try {
      await extra.progressRepository.resetProgress(bookId);
    } catch (error) {
      logger.warn('book: resetting the progress failed', error);
      return false;
    }
    dispatch(progressChanged({ bookId, progress: null }));
    return true;
  };
