import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toChapterIndex, toSentenceIndex } from '@/shared/domain';
import type { PlayerRootState } from '../state/playerSlice';
import { playerView } from '../services/playerView';
import { selectIsOpening, selectSession } from '../state/selectors';
import {
  acknowledgeVoice,
  openVoiceSettings,
  retryPlayback,
  seekTo,
  skipChapter,
  togglePlayback,
} from '../state/thunks';
import { usePlayerDispatch } from './usePlayerDispatch';

/** What the tab shows, the book, and what can be asked of the session. */
export function usePlaybackSession() {
  const dispatch = usePlayerDispatch();
  const opening = useSelector(selectIsOpening);
  const view = useSelector((state: PlayerRootState) =>
    playerView(selectSession(state), opening),
  );
  const bookId = useSelector(selectSession).bookId;
  const voiceReplaced = useSelector(selectSession).voiceReplaced;
  const actions = useMemo(
    () => ({
      read: (chapter: number, sentence: number) =>
        dispatch(
          seekTo({
            chapter: toChapterIndex(chapter),
            sentence: toSentenceIndex(sentence),
          }),
        ),
      play: () => dispatch(togglePlayback()),
      retry: () => dispatch(retryPlayback()),
      skipChapter: () => dispatch(skipChapter()),
      openVoiceSettings: () => dispatch(openVoiceSettings()),
      acknowledgeVoice: () => dispatch(acknowledgeVoice()),
    }),
    [dispatch],
  );
  return { view, bookId, voiceReplaced, actions };
}

export type PlayerActions = ReturnType<typeof usePlaybackSession>['actions'];
