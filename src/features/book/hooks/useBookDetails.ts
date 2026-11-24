import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  selectBookById,
  selectBookProgress,
  selectProgressLoaded,
} from '@/features/library';
import type { BookId, BookMeta, Progress } from '@/shared/domain';
import type { BookRootState } from '../model/dependencies';
import { selectBookContent, type BookContent } from '../state/contentSlice';
import { loadBookContent } from '../state/contentThunks';
import { selectDeletion } from '../state/deletionSlice';
import { useBookDispatch } from './useBookDispatch';

/** The book and everything read of it, once there is something to show. */
export interface LoadedBook {
  readonly book: BookMeta;
  readonly progress: Progress | null;
  readonly content: BookContent;
}

export type BookView =
  | { readonly type: 'missing' | 'loading' | 'delete-failed' }
  | { readonly type: 'loaded'; readonly loaded: LoadedBook };

/**
 * What the screen shows of the book. Its content is read again whenever the import saves a chapter
 * or ends. While a delete runs, the book may already be out of the library: that is not missing.
 */
export function useBookDetails(bookId: BookId): BookView {
  const dispatch = useBookDispatch();
  const book = useSelector((s: BookRootState) => selectBookById(s, bookId));
  const progress = useSelector((s: BookRootState) =>
    selectBookProgress(s, bookId),
  );
  const progressLoaded = useSelector(selectProgressLoaded);
  const content = useSelector((s: BookRootState) =>
    selectBookContent(s, bookId),
  );
  const deletion = useSelector((s: BookRootState) => selectDeletion(s, bookId));

  const exists = book !== null;
  const processedPages = book?.processedPages;
  const status = book?.status;
  useEffect(() => {
    if (exists) {
      dispatch(loadBookContent(bookId));
    }
  }, [dispatch, bookId, exists, processedPages, status]);

  if (deletion === 'failed') {
    return { type: 'delete-failed' };
  }
  if (deletion === 'deleting') {
    return { type: 'loading' };
  }
  if (book === null) {
    return { type: 'missing' };
  }
  return content === null || !progressLoaded
    ? { type: 'loading' }
    : { type: 'loaded', loaded: { book, progress, content } };
}
