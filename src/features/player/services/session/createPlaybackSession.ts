import type { BookId, ChapterChunk } from '@/shared/domain';
import type { Position } from '../../model/types';
import { remainingCharacters } from '../remainingTime';
import { startSleepTimer, type SleepOption } from '../sleepTimer';
import { createCore, currentChunk, report, update } from './core';
import { advance, enter, seekPage, seekSentence } from './navigation';
import { startSpeaking } from './speech';
import {
  close,
  discard,
  open,
  pause,
  play,
  skipChapter,
  updateBook,
  type OpenAt,
} from './transport';
import type {
  SessionBook,
  SessionCore,
  SessionPorts,
  SessionSnapshot,
} from './types';

/** Reads a book aloud, sentence by sentence (the `tts-playback-engine` skill). */
export interface PlaybackSession {
  snapshot(): SessionSnapshot;
  /** The text of the current chapter, if it is in memory. */
  text(): ChapterChunk | null;
  /** Seconds left of what is saved; `null` without a book. */
  remainingSeconds(): number | null;
  open(book: SessionBook, options: OpenAt): void;
  updateBook(book: SessionBook): void;
  close(): void;
  discard(bookId: BookId): void;
  play(): void;
  pause(): void;
  skipChapter(): void;
  seekTo(position: Position): void;
  seekSentence(delta: number): void;
  seekPage(page: number): void;
  setSleep(option: SleepOption): void;
  /** The speed, pitch or voice changed: the current sentence starts again with them. */
  settingsChanged(): void;
  /** The voice notice was shown. */
  acknowledgeVoice(): void;
  /** Stores the position now (the app goes to the background). */
  flush(): void;
}

function settingsChanged(core: SessionCore): void {
  if (core.ports.settings().voiceId !== core.pickedFor) {
    core.voiceId = undefined;
  }
  if (core.snapshot.status === 'playing') {
    startSpeaking(core, advance).catch(() => {});
  }
}

function remainingSeconds(core: SessionCore): number | null {
  const { book, cache, snapshot } = core;
  if (book === null || cache === null || snapshot.position === null) {
    return null;
  }
  const left = remainingCharacters(book.toc, snapshot.position, cache.peek);
  return left / core.meter.speedAt(core.ports.settings().rate);
}

export function createPlaybackSession(ports: SessionPorts): PlaybackSession {
  const core = createCore(ports);
  return {
    snapshot: () => core.snapshot,
    text: () => currentChunk(core),
    remainingSeconds: () => remainingSeconds(core),
    open: (book, options) => open(core, book, options),
    updateBook: book => updateBook(core, book),
    close: () => close(core),
    discard: bookId => discard(core, bookId),
    play: () => play(core),
    pause: () => pause(core),
    skipChapter: () => skipChapter(core),
    seekTo: position => {
      if (core.book !== null) {
        enter(core, position);
      }
    },
    seekSentence: delta => seekSentence(core, delta),
    seekPage: page => seekPage(core, page),
    setSleep: option =>
      update(core, { sleep: startSleepTimer(option, ports.now()) }),
    settingsChanged: () => settingsChanged(core),
    acknowledgeVoice: () => update(core, { voiceReplaced: false }),
    flush: () => {
      if (core.snapshot.status === 'playing') {
        report(core, 'now');
      }
    },
  };
}
