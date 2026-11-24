import {
  createListenerMiddleware,
  type TypedStartListening,
} from '@reduxjs/toolkit';
import {
  bookRemoved,
  bookUpserted,
  selectImportingBookId,
} from '@/features/book';
import { selectSettings, settingsChanged } from '@/features/settings';
import { playbackRequested } from '@/shared/domain';
import { logger } from '@/shared/utils';
import type {
  PlayerAppState,
  PlayerDependencies,
  PlayerDispatch,
} from '../model/dependencies';
import { openBook, refreshBook } from './openBook';
import { forgetBook, peekRuntime } from './runtime';
import { selectSession } from './selectors';

type StartListening = TypedStartListening<
  PlayerAppState,
  PlayerDispatch,
  PlayerDependencies
>;

function followBooks(startListening: StartListening): void {
  startListening({
    actionCreator: playbackRequested,
    effect: ({ payload }, api) => openBook(api, payload, true),
  });
  startListening({
    actionCreator: bookUpserted,
    effect: ({ payload }, api) => {
      if (payload.id === selectSession(api.getState()).bookId) {
        return refreshBook(api, payload.id);
      }
      return undefined;
    },
  });
  startListening({
    actionCreator: bookRemoved,
    effect: ({ payload }, api) => forgetBook(api, payload),
  });
  // An import that stalls or is cancelled changes no book
  startListening({
    predicate: (_action, now, before) =>
      selectImportingBookId(now) !== selectImportingBookId(before),
    effect: (_action, api) => {
      const { bookId } = selectSession(api.getState());
      return bookId === null ? undefined : refreshBook(api, bookId);
    },
  });
}

function followSettings(startListening: StartListening): void {
  startListening({
    actionCreator: settingsChanged,
    effect: (_action, { getState, getOriginalState, extra }) => {
      const runtime = peekRuntime(extra);
      const now = selectSettings(getState());
      const before = selectSettings(getOriginalState());
      if (
        now.voiceId !== before.voiceId ||
        now.defaultRate !== before.defaultRate ||
        now.pitch !== before.pitch
      ) {
        runtime?.session.settingsChanged();
      }
      if (now.backgroundPlayback !== before.backgroundPlayback) {
        runtime?.notice.update(runtime.session.snapshot());
      }
    },
  });
}

/** The player's reactions to what happens in the app; the store adds its middleware. */
export function createPlayerListeners(extra: PlayerDependencies) {
  const listeners = createListenerMiddleware({
    extra,
    onError: error => logger.warn('player: a listener failed', error),
  });
  const startListening = listeners.startListening as StartListening;
  followBooks(startListening);
  followSettings(startListening);
  return listeners.middleware;
}
