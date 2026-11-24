import { progressChanged } from '@/features/book';
import { selectSettings } from '@/features/settings';
import type { BookId } from '@/shared/domain';
import type { PlayerDependencies, PlayerStoreApi } from '../model/dependencies';
import {
  createProgressWriter,
  type ProgressWriter,
} from '../services/progressWriter';
import {
  createPlaybackSession,
  type PlaybackSession,
} from '../services/session';
import { createNotice, type PlaybackNotice } from './notice';
import { openingChanged, sessionChanged } from './playerSlice';

/** The player behind a store: its session and what it writes. */
export interface PlayerRuntime {
  readonly session: PlaybackSession;
  readonly writer: ProgressWriter;
  readonly notice: PlaybackNotice;
  /** Raised by every book asked for: an older one that is read later is ignored. */
  request: number;
}

const runtimes = new WeakMap<PlayerDependencies, PlayerRuntime>();

const createWriter = ({ dispatch, extra }: PlayerStoreApi) =>
  createProgressWriter({
    save: (id, progress) => extra.progressRepository.saveProgress(id, progress),
    // Only what is stored reaches the library, so it isn't sorted again at every sentence
    onSaved: (bookId, progress) =>
      dispatch(progressChanged({ bookId, progress })),
    now: Date.now,
  });

function createSession(
  api: PlayerStoreApi,
  { writer, notice }: Pick<PlayerRuntime, 'writer' | 'notice'>,
): PlaybackSession {
  const { dispatch, getState, extra } = api;
  return createPlaybackSession({
    engine: extra.ttsEngine,
    readChapter: (id, chapter) => extra.bookRepository.getChapter(id, chapter),
    settings: () => {
      const { voiceId, defaultRate, pitch } = selectSettings(getState());
      return { voiceId, rate: defaultRate, pitch };
    },
    now: Date.now,
    reportProgress: writer.report,
    onChange: snapshot => {
      dispatch(sessionChanged(snapshot));
      notice.update(snapshot);
    },
  });
}

/** The system speaks to the session: interruptions, the notification, a book being let go of. */
function connect(
  { dispatch, extra }: PlayerStoreApi,
  runtime: PlayerRuntime,
): void {
  const { session, writer } = runtime;
  extra.ttsEngine.onInterruption(session.pause);
  extra.playbackNotifier.onCommand(command => {
    if (command === 'play') {
      session.play();
    } else {
      session.pause();
    }
  });
  extra.bookRelease.onRelease(async (id, reason) => {
    runtime.request += 1;
    if (reason === 'deleted') {
      writer.refuse(id);
    }
    session.discard(id);
    dispatch(openingChanged(null));
    await writer.drain(id);
  });
}

/** The player of this store; made on first use, one for each store's dependencies. */
export function getRuntime(api: PlayerStoreApi): PlayerRuntime {
  const known = runtimes.get(api.extra);
  if (known) {
    return known;
  }
  const parts = { writer: createWriter(api), notice: createNotice(api) };
  const runtime: PlayerRuntime = {
    ...parts,
    session: createSession(api, parts),
    request: 0,
  };
  runtimes.set(api.extra, runtime);
  connect(api, runtime);
  return runtime;
}

/** The player, if something was ever played; for what only matters then. */
export const peekRuntime = (
  extra: PlayerDependencies,
): PlayerRuntime | undefined => runtimes.get(extra);

/** A book removed behind the player's back (its import cancelled) leaves no progress behind. */
export async function forgetBook(
  { extra }: PlayerStoreApi,
  id: BookId,
): Promise<void> {
  const runtime = peekRuntime(extra);
  if (!runtime || runtime.writer.isRefused(id)) {
    return;
  }
  const { session, writer } = runtime;
  writer.refuse(id);
  session.discard(id);
  await writer.drain(id);
  if (writer.hasWritten(id)) {
    await extra.progressRepository.resetProgress(id);
  }
}
