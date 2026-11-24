import { useCallback } from 'react';
import { playbackRequested, type PlaybackRequest } from '@/shared/domain';
import type { BookId } from '@/shared/domain';
import { resetProgress } from '../state/contentThunks';
import { useBookDispatch } from './useBookDispatch';

export type PlaybackStart = Omit<PlaybackRequest, 'bookId'>;

/** Requests the playback and opens the player; `restart` forgets where listening stopped first. */
export function usePlayBook(bookId: BookId, onPlay: () => void) {
  const dispatch = useBookDispatch();
  const play = useCallback(
    (from: PlaybackStart = {}) => {
      dispatch(playbackRequested({ bookId, ...from }));
      onPlay();
    },
    [dispatch, bookId, onPlay],
  );
  const restart = useCallback(async () => {
    if (await dispatch(resetProgress(bookId))) {
      play();
    }
  }, [dispatch, bookId, play]);
  return { play, restart };
}
