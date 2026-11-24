import type { BookId } from '@/shared/domain';
import type { Position } from '../../model/types';
import { createChapterCache } from '../chapterCache';
import {
  clampPosition,
  firstPosition,
  nextChapter,
  previousPosition,
} from '../position';
import { report, silence, update } from './core';
import { enter, following, reachEnd } from './navigation';
import { fail } from './speech';
import { IDLE, type SessionBook, type SessionCore } from './types';

/** A longer pause resumes one sentence earlier, for context. */
export const REWIND_AFTER_MS = 5 * 60_000;

/** Leaves the current book, storing where it is. */
export function close(core: SessionCore): void {
  if (core.book === null) {
    return;
  }
  silence(core);
  if (core.snapshot.status === 'playing') {
    report(core, 'now');
  }
  core.cache?.clear();
  core.book = null;
  core.cache = null;
  core.wantsPlay = false;
  core.voiceId = undefined;
  core.pausedAt = null;
  core.reportedChapter = null;
  update(core, IDLE);
}

export interface OpenAt {
  /** `null`: the beginning. */
  readonly at: Position | null;
  readonly play: boolean;
}

/** Goes where asked, or as close as what is saved allows. */
function start(core: SessionCore, book: SessionBook, at: Position | null) {
  const target = at ? clampPosition(book.toc, at) : firstPosition(book.toc);
  if (target !== null) {
    enter(core, target);
  } else if (book.completeness === 'complete') {
    fail(core, 'text');
  } else {
    reachEnd(core);
  }
}

/** Opens a book; the one already open keeps its chapters in memory. */
export function open(core: SessionCore, book: SessionBook, options: OpenAt) {
  if (core.book?.id !== book.id) {
    close(core);
    core.cache = createChapterCache(chapter =>
      core.ports.readChapter(book.id, chapter),
    );
  }
  core.book = book;
  core.pausedAt = null;
  core.restoring = !options.play;
  core.voiceId = undefined;
  core.wantsPlay = options.play;
  update(core, { bookId: book.id });
  start(core, book, options.at);
}

export function pause(core: SessionCore): void {
  const { status, waiting } = core.snapshot;
  core.wantsPlay = false;
  if (status === 'playing' || waiting) {
    silence(core);
    core.pausedAt = core.ports.now();
    update(core, { status: 'paused', waiting: false });
    report(core, 'now');
  }
}

/** Resumes, starts an ended book over, or tries again after an error. */
export function play(core: SessionCore): void {
  const { book } = core;
  const { status, position } = core.snapshot;
  if (book === null || status === 'playing') {
    return;
  }
  core.wantsPlay = true;
  if (status === 'loading') {
    return;
  }
  const away = core.ports.now() - (core.pausedAt ?? core.ports.now());
  core.pausedAt = null;
  // Voices may have been installed, or removed, meanwhile
  core.voiceId = undefined;
  if (status === 'ended') {
    start(core, book, core.snapshot.incomplete ? following(core) : null);
  } else if (position !== null && away > REWIND_AFTER_MS) {
    enter(core, previousPosition(book.toc, position) ?? position);
  } else {
    start(core, book, position);
  }
}

/** Past a chapter that can't be read. */
export function skipChapter(core: SessionCore): void {
  const { book } = core;
  const { position } = core.snapshot;
  if (book === null) {
    return;
  }
  core.wantsPlay = true;
  const next = nextChapter(book.toc, position?.chapter ?? -1);
  if (next === null) {
    reachEnd(core);
  } else {
    enter(core, { chapter: next.index, sentence: 0 });
  }
}

/** The book changed: its import saved a chapter, ended or stopped. */
export function updateBook(core: SessionCore, book: SessionBook): void {
  if (core.book?.id !== book.id) {
    return;
  }
  core.book = book;
  const { waiting, incomplete, position } = core.snapshot;
  if (!waiting && !incomplete) {
    return;
  }
  const next = position === null ? firstPosition(book.toc) : following(core);
  if (next !== null) {
    enter(core, next);
  } else if (
    book.completeness === 'complete' ||
    (waiting && book.completeness === 'incomplete')
  ) {
    reachEnd(core);
  }
}

/** Stops everything of a book that is being deleted or started over, without storing anything. */
export function discard(core: SessionCore, bookId: BookId): void {
  if (core.book?.id === bookId) {
    silence(core);
    core.snapshot = { ...core.snapshot, loaded: false };
    close(core);
  }
}
