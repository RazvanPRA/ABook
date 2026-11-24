import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { usePlayerDispatch } from '../../hooks/usePlayerDispatch';
import { selectPlayerBook, selectSession } from '../../state/selectors';
import { togglePlayback } from '../../state/thunks';
import { useCurrentChapterTitle } from '../PlayerHeader';

/** What the mini-player shows; `null` when there is nothing to go back to. */
export function useMiniPlayer() {
  const { t } = useTranslation();
  const dispatch = usePlayerDispatch();
  const { status, waiting, page } = useSelector(selectSession);
  const book = useSelector(selectPlayerBook);
  const chapter = useCurrentChapterTitle();
  const toggle = useCallback(() => {
    dispatch(togglePlayback());
  }, [dispatch]);
  if (book === null || status === 'idle' || status === 'ended') {
    return null;
  }
  const playing = status === 'playing' || waiting;
  return {
    book,
    chapter,
    progress: book.pageCount > 0 ? (page ?? 0) / book.pageCount : 0,
    cover: t('book.cover', { title: book.title }),
    open: t('player.mini.open', { title: book.title }),
    button: {
      icon: playing ? ('pause' as const) : ('play' as const),
      accessibilityLabel: t(playing ? 'player.pause' : 'player.play'),
      disabled: status === 'loading' && !waiting,
      onPress: toggle,
    },
  };
}
