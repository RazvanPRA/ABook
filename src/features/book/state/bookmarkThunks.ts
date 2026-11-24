import { v4 as uuid } from 'uuid';
import { selectBookById } from '@/features/library';
import type { BookId, Bookmark } from '@/shared/domain';
import { logger } from '@/shared/utils';
import type { BookRootState, BookThunk } from '../model/dependencies';
import { makeExcerpt } from '../services/makeExcerpt';
import { bookmarksChanged, selectBookContent } from './contentSlice';
import { selectDeletion } from './deletionSlice';

/** A sentence to bookmark, with its whole text. */
export type BookmarkPlace = Pick<Bookmark, 'chapter' | 'sentence' | 'page'> & {
  readonly text: string;
};

/** The bookmarks as read; `null` for a book deleted, or being deleted: a write would leave a key. */
function writableBookmarks(
  state: BookRootState,
  bookId: BookId,
): readonly Bookmark[] | null {
  const writable =
    selectBookById(state, bookId) !== null &&
    selectDeletion(state, bookId) === null;
  return writable
    ? (selectBookContent(state, bookId)?.bookmarks ?? null)
    : null;
}

/** Shows the change at once; if it can't be written, it is taken back. Returns whether it stayed. */
const replaceBookmarks =
  (
    bookId: BookId,
    change: (before: readonly Bookmark[]) => Bookmark[],
  ): BookThunk<boolean> =>
  async (dispatch, getState, extra) => {
    const before = writableBookmarks(getState(), bookId);
    if (before === null) {
      return false;
    }
    const bookmarks = change(before);
    if (bookmarks.length === before.length) {
      return true;
    }
    dispatch(bookmarksChanged({ bookId, bookmarks }));
    try {
      await extra.progressRepository.saveBookmarks(bookId, bookmarks);
      return true;
    } catch (error) {
      logger.warn('book: saving the bookmarks failed', error);
      dispatch(bookmarksChanged({ bookId, bookmarks: [...before] }));
      return false;
    }
  };

/** Removes a bookmark for good. */
export const removeBookmark = (
  bookId: BookId,
  bookmarkId: string,
): BookThunk<boolean> =>
  replaceBookmarks(bookId, before =>
    before.filter(({ id }) => id !== bookmarkId),
  );

/** Adds a bookmark, in the order of the book; a sentence that has one keeps it. */
export const addBookmark = (
  bookId: BookId,
  { chapter, sentence, page, text }: BookmarkPlace,
): BookThunk<boolean> =>
  replaceBookmarks(bookId, before => {
    const known = before.some(
      own => own.chapter === chapter && own.sentence === sentence,
    );
    const added: Bookmark = {
      id: uuid(),
      chapter,
      sentence,
      page,
      excerpt: makeExcerpt(text),
      createdAt: new Date().toISOString(),
    };
    return known
      ? [...before]
      : [...before, added].sort(
          (a, b) => a.chapter - b.chapter || a.sentence - b.sentence,
        );
  });
