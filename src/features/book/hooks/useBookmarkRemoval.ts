import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BookId, Bookmark } from '@/shared/domain';
import { removeBookmark } from '../state/contentThunks';
import { useBookDispatch } from './useBookDispatch';

export const UNDO_MS = 5000;

/**
 * Removing a bookmark hides it at once and writes it 5 s later, unless undone. Removing another one
 * or leaving the screen writes the one waiting.
 */
export function useBookmarkRemoval(
  bookId: BookId,
  bookmarks: readonly Bookmark[],
) {
  const dispatch = useBookDispatch();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const waiting = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    const id = waiting.current;
    waiting.current = null;
    return id;
  }, []);

  const write = useCallback(() => {
    const id = stop();
    if (id !== null) {
      dispatch(removeBookmark(bookId, id));
    }
  }, [dispatch, bookId, stop]);
  useEffect(() => write, [write]);

  const remove = useCallback(
    (id: string) => {
      write();
      waiting.current = id;
      setPendingId(id);
      timer.current = setTimeout(() => {
        write();
        setPendingId(null);
      }, UNDO_MS);
    },
    [write],
  );
  const undo = useCallback(() => {
    stop();
    setPendingId(null);
  }, [stop]);

  const visible = useMemo(
    () => bookmarks.filter(({ id }) => id !== pendingId),
    [bookmarks, pendingId],
  );
  return { visible, pending: pendingId !== null, remove, undo };
}
