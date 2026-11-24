import type {
  BookId,
  BookLanguage,
  ChapterChunk,
  ChapterIndex,
  PageNumber,
  Progress,
} from '@/shared/domain';
import type { TtsEngine } from '@/services/tts';
import type { Position, Toc } from '../../model/types';
import type { ChapterCache } from '../chapterCache';
import type { SleepTimer } from '../sleepTimer';
import type { SpeechMeter } from '../speechMeter';

export type SessionStatus =
  'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

/** `speech`: the engine failed. `voice`: no voice of the language. `text`: the chapter can't be read. */
export type SessionError = 'speech' | 'voice' | 'text';

/** How far the book's import is: more chapters come, none will, or all are there. */
export type BookCompleteness = 'importing' | 'incomplete' | 'complete';

/** What the session needs of a book; replaced as its import saves chapters. */
export interface SessionBook {
  readonly id: BookId;
  readonly language: BookLanguage;
  readonly completeness: BookCompleteness;
  readonly toc: Toc;
}

/** Everything the outside sees of a session. Plain data: the store mirrors it. */
export interface SessionSnapshot {
  readonly status: SessionStatus;
  readonly bookId: BookId | null;
  readonly position: Position | null;
  readonly page: PageNumber | null;
  /** The text of the position's chapter is in memory. */
  readonly loaded: boolean;
  /** While `loading`: the next chapter isn't imported yet. */
  readonly waiting: boolean;
  /** With `ended`: the import stopped, so this is not the end of the book. */
  readonly incomplete: boolean;
  readonly error: SessionError | null;
  readonly sleep: SleepTimer;
  /** The saved voice is gone and another one reads. */
  readonly voiceReplaced: boolean;
}

export const IDLE: SessionSnapshot = {
  status: 'idle',
  bookId: null,
  position: null,
  page: null,
  loaded: false,
  waiting: false,
  incomplete: false,
  error: null,
  sleep: { type: 'off' },
  voiceReplaced: false,
};

export interface SpeechSettings {
  readonly voiceId: string | null;
  readonly rate: number;
  readonly pitch: number;
}

/** `soon` may wait for the throttle; `now` may not. */
export type ReportUrgency = 'soon' | 'now';

/** What the session is given; it knows neither Redux nor React. */
export interface SessionPorts {
  readonly engine: TtsEngine;
  readChapter(
    bookId: BookId,
    chapter: ChapterIndex,
  ): Promise<ChapterChunk | null>;
  settings(): SpeechSettings;
  now(): number;
  reportProgress(
    bookId: BookId,
    progress: Progress,
    urgency: ReportUrgency,
  ): void;
  onChange(snapshot: SessionSnapshot): void;
}

/** The session's state, shared by its parts. */
export interface SessionCore {
  readonly ports: SessionPorts;
  readonly meter: SpeechMeter;
  snapshot: SessionSnapshot;
  book: SessionBook | null;
  cache: ChapterCache | null;
  /** Raised by everything that changes what should be heard; older callbacks are ignored. */
  token: number;
  /** Once what loads is there, it is read aloud. */
  wantsPlay: boolean;
  /** The voice of this play; `undefined` until picked. */
  voiceId: string | undefined;
  /** The saved voice it was picked for. */
  pickedFor: string | null;
  /** When it was paused; `null` after a restart, which doesn't rewind. */
  pausedAt: number | null;
  /** Opened where it was left: nothing new to store until something moves. */
  restoring: boolean;
  /** Chapter of the last stored position: a new one is stored at once. */
  reportedChapter: ChapterIndex | null;
}
