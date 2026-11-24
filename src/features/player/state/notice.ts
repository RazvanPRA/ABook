import { chapterTitle, selectBookById } from '@/features/book';
import { selectSettings } from '@/features/settings';
import type { PlaybackInfo } from '@/services/tts';
import { i18n } from '@/shared/i18n';
import type { PlayerStoreApi } from '../model/dependencies';
import type { SessionSnapshot } from '../services/session';
import { selectPlayerToc } from './tocs';

/** What the notification shows of the session; `null` hides it. */
function infoOf(
  { getState }: PlayerStoreApi,
  { bookId, position, status }: SessionSnapshot,
): PlaybackInfo | null {
  const state = getState();
  const book = bookId === null ? null : selectBookById(state, bookId);
  if (book === null || !selectSettings(state).backgroundPlayback) {
    return null;
  }
  const chapter = selectPlayerToc(state, book.id)[position?.chapter ?? -1];
  const playing = status === 'playing' || status === 'loading';
  return {
    title: book.title,
    text: chapter
      ? chapterTitle(chapter, number =>
          i18n.t('book.chapters.untitled', { number }),
        )
      : book.author,
    playing,
    actionLabel: i18n.t(playing ? 'player.pause' : 'player.play'),
    channelName: i18n.t('player.notification'),
  };
}

export interface PlaybackNotice {
  /** Shows, changes or hides it, after a change of the session or of the settings. */
  update(snapshot: SessionSnapshot): void;
}

/**
 * Keeps the background playback's notification in step with the session: it starts with the first
 * sentence, stays while paused and goes away when nothing is played any more.
 */
export function createNotice(api: PlayerStoreApi): PlaybackNotice {
  const { playbackNotifier } = api.extra;
  let shown: PlaybackInfo | null = null;

  const isSame = (info: PlaybackInfo) =>
    shown !== null &&
    (Object.keys(info) as (keyof PlaybackInfo)[]).every(
      key => info[key] === shown?.[key],
    );

  return {
    update(snapshot: SessionSnapshot): void {
      const { status } = snapshot;
      const starts = status === 'playing';
      const stays = status === 'paused' || status === 'loading';
      const info =
        starts || (stays && shown !== null) ? infoOf(api, snapshot) : null;
      if (info === null) {
        if (shown !== null) {
          shown = null;
          playbackNotifier.hide();
        }
      } else if (!isSame(info)) {
        shown = info;
        playbackNotifier.show(info);
      }
    },
  };
}
