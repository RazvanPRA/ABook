import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  addBookmark,
  removeBookmark,
  selectBookContent,
} from '@/features/book';
import { toSentenceIndex } from '@/shared/domain';
import type { PlayerAppState } from '../model/dependencies';
import { selectSession } from '../state/selectors';
import { readText } from '../state/thunks';
import { usePlayerDispatch } from './usePlayerDispatch';

/** How long the notice of what happened stays. */
export const NOTICE_MS = 4000;

export type BookmarkNotice = 'added' | 'removed' | 'failed';

/** The last notice, until it fades. */
function useNotice() {
  const [notice, setNotice] = useState<BookmarkNotice | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = useCallback((next: BookmarkNotice) => {
    clearTimeout(timer.current);
    setNotice(next);
    timer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);
  return { notice, show };
}

/** Adds a bookmark to a sentence of the current chapter; the header's button toggles the active one. */
export function usePlayerBookmarks() {
  const dispatch = usePlayerDispatch();
  const { bookId, position, loaded } = useSelector(selectSession);
  const { notice, show } = useNotice();
  const bookmarks = useSelector((state: PlayerAppState) =>
    bookId === null ? null : selectBookContent(state, bookId),
  )?.bookmarks;
  const current = useMemo(
    () =>
      bookmarks?.find(
        own =>
          own.chapter === position?.chapter &&
          own.sentence === position.sentence,
      ) ?? null,
    [bookmarks, position],
  );
  const chapter = position?.chapter;
  const add = useCallback(
    async (index: number) => {
      const chunk = dispatch(readText());
      const text = chunk?.sentences[index];
      const page = chunk?.sentencePages[index];
      if (bookId === null || chapter === undefined || !text || !page) {
        return;
      }
      const sentence = toSentenceIndex(index);
      const place = { chapter, sentence, page, text };
      const added = await dispatch(addBookmark(bookId, place));
      show(added ? 'added' : 'failed');
    },
    [dispatch, bookId, chapter, show],
  );
  const toggle = async () => {
    if (current === null || bookId === null) {
      await add(position?.sentence ?? -1);
    } else {
      const removed = await dispatch(removeBookmark(bookId, current.id));
      show(removed ? 'removed' : 'failed');
    }
  };
  return { active: current !== null, enabled: loaded, notice, add, toggle };
}
