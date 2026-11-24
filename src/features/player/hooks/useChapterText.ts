import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { ChapterChunk } from '@/shared/domain';
import { selectSession } from '../state/selectors';
import { readText } from '../state/thunks';
import { groupParagraphs } from '../services/paragraphs';
import type { Paragraph } from '../model/types';
import { usePlayerDispatch } from './usePlayerDispatch';

export interface ChapterText {
  readonly chapter: number;
  readonly chunk: ChapterChunk;
  readonly paragraphs: readonly Paragraph[];
}

/** The current chapter's text, kept by the session, not by the store; `null` until it is loaded. */
export function useChapterText(): ChapterText | null {
  const dispatch = usePlayerDispatch();
  const bookId = useSelector(selectSession).bookId;
  const loaded = useSelector(selectSession).loaded;
  const chapter = useSelector(selectSession).position?.chapter ?? -1;
  return useMemo(() => {
    const chunk = bookId !== null && loaded ? dispatch(readText()) : null;
    return chunk && { chapter, chunk, paragraphs: groupParagraphs(chunk) };
  }, [dispatch, bookId, loaded, chapter]);
}
