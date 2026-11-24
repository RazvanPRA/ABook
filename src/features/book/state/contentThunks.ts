import { nanoid } from '@reduxjs/toolkit';
import { progressChanged, selectBookById } from '@/features/library';
import type { BookId } from '@/shared/domain';
import { logger } from '@/shared/utils';
import type { BookThunk } from '../model/dependencies';
import { contentLoaded, contentRequested } from './contentSlice';

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
  async (dispatch, getState, extra) => {
    const book = selectBookById(getState(), bookId);
    if (book === null) {
      return;
    }
    const request = nanoid();
    dispatch(contentRequested({ bookId, request }));
    const [hasPdf, toc, bookmarks] = await Promise.all([
      attempt(extra.bookRepository.hasPdf(book), false),
      attempt(extra.bookRepository.getToc(bookId), null),
      attempt(extra.progressRepository.getBookmarks(bookId), []),
    ]);
    dispatch(
      contentLoaded({ bookId, request, hasPdf, toc: toc ?? [], bookmarks }),
    );
  };

/** "Ascultă din nou": the book is as if never played. Returns whether it worked. */
export const resetProgress =
  (bookId: BookId): BookThunk<boolean> =>
  async (dispatch, _getState, extra) => {
    try {
      await extra.bookRelease.release(bookId, 'restarted');
      await extra.progressRepository.resetProgress(bookId);
    } catch (error) {
      logger.warn('book: resetting the progress failed', error);
      return false;
    }
    dispatch(progressChanged({ bookId, progress: null }));
    return true;
  };
