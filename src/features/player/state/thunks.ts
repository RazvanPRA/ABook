import { selectContinueListening, selectProgressLoaded } from '@/features/book';
import { changeSettings, selectSettings } from '@/features/settings';
import {
  playbackRequested,
  type ChapterChunk,
  type FontScale,
} from '@/shared/domain';
import type { PlayerStoreApi, PlayerThunk } from '../model/dependencies';
import type { Position } from '../model/types';
import type { PlaybackSession } from '../services/session';
import type { SleepOption } from '../services/sleepTimer';
import { openBook } from './openBook';
import { getRuntime, peekRuntime } from './runtime';
import { selectPlayerHasBook, selectSession } from './selectors';

/** A thunk that only talks to the session. */
const withSession =
  <Result>(run: (session: PlaybackSession) => Result): PlayerThunk<Result> =>
  (dispatch, getState, extra) =>
    run(getRuntime({ dispatch, getState, extra }).session);

export const pausePlayback = () => withSession(session => session.pause());
export const seekSentence = (delta: number) =>
  withSession(session => session.seekSentence(delta));
export const seekPage = (page: number) =>
  withSession(session => session.seekPage(page));
export const seekTo = (position: Position) =>
  withSession(session => session.seekTo(position));
export const skipChapter = () => withSession(session => session.skipChapter());
export const setSleep = (option: SleepOption) =>
  withSession(session => session.setSleep(option));
export const acknowledgeVoice = () =>
  withSession(session => session.acknowledgeVoice());

/** The text of the current chapter, if it is in memory. */
export const readText = () =>
  withSession((session): ChapterChunk | null => session.text());
export const readRemainingSeconds = () =>
  withSession(session => session.remainingSeconds());

export const togglePlayback = () =>
  withSession(session => {
    if (session.snapshot().status === 'playing') {
      session.pause();
    } else {
      session.play();
    }
  });

/** "Încearcă din nou": a text error reads the book's chapters again too. */
export const retryPlayback = (): PlayerThunk => (dispatch, getState, extra) => {
  const { error, bookId, position } = selectSession(getState());
  if (error === 'text' && bookId !== null) {
    dispatch(playbackRequested({ bookId, ...position }));
  } else {
    getRuntime({ dispatch, getState, extra }).session.play();
  }
};

/** The tab without a book opens the one to continue, paused. */
export const restorePlayback =
  (): PlayerThunk<Promise<void>> => async (dispatch, getState, extra) => {
    const state = getState();
    const current = selectContinueListening(state);
    if (
      selectProgressLoaded(state) &&
      !selectPlayerHasBook(state) &&
      current !== null
    ) {
      const api: PlayerStoreApi = { dispatch, getState, extra };
      await openBook(api, { bookId: current.book.id }, false);
    }
  };

export const setRate = (defaultRate: number) => changeSettings({ defaultRate });
export const setFontScale = (fontScale: FontScale) =>
  changeSettings({ fontScale });

/** Android: where a voice is installed. Nothing happens where there is no such place. */
export const openVoiceSettings =
  (): PlayerThunk<Promise<void>> => (_dispatch, _getState, extra) =>
    extra.ttsEngine.openSettings().catch(() => {});

/** The app goes to the background: the position is stored, and without background playback it stops. */
export const playerBackgrounded =
  (): PlayerThunk<Promise<void>> => async (_dispatch, getState, extra) => {
    const runtime = peekRuntime(extra);
    if (!runtime) {
      return;
    }
    if (!selectSettings(getState()).backgroundPlayback) {
      runtime.session.pause();
    }
    runtime.session.flush();
    await runtime.writer.flush();
  };
