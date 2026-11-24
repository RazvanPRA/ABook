import { useCallback, useEffect, useRef } from 'react';
import type { BookId } from '@/shared/domain';
import { deleteBook } from '../state/deleteBook';
import { useBookDispatch } from './useBookDispatch';

/** Deletes the book, then leaves the screen, unless the user already left it. */
export function useDeleteBook(bookId: BookId, onDeleted: () => void) {
  const dispatch = useBookDispatch();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return useCallback(async () => {
    const deleted = await dispatch(deleteBook(bookId));
    if (deleted && mounted.current) {
      onDeleted();
    }
  }, [dispatch, bookId, onDeleted]);
}
