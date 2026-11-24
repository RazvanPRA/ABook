import {
  toPageNumber,
  toSentenceIndex,
  type ChapterChunk,
  type ChapterIndex,
} from '@/shared/domain';
import { clamp } from '@/shared/utils';
import type { Position } from '../../model/types';
import {
  chapterOfPage,
  nextChapter,
  nextPosition,
  pageOf,
  previousPosition,
  sentenceOfPage,
} from '../position';
import { isSleepDue, SLEEP_OFF } from '../sleepTimer';
import { currentChunk, newToken, report, silence, update } from './core';
import { fail, startSpeaking } from './speech';
import type { SessionCore } from './types';

/** Where to go: a sentence, or the first one of a page. */
interface Target {
  readonly chapter: ChapterIndex;
  readonly sentence: number;
  readonly page?: number;
}

/** Shows the position as wanted until its text is there. */
function aim(core: SessionCore, { chapter, sentence, page }: Target): void {
  const position = { chapter, sentence: toSentenceIndex(sentence) };
  const chunk = core.cache?.peek(chapter) ?? null;
  update(core, {
    position,
    page:
      page === undefined
        ? pageOf(core.book?.toc ?? [], position, chunk)
        : toPageNumber(page),
    loaded: chunk !== null,
  });
}

/** The chapter's text is there: the position becomes exact and is read, or only shown. */
function settle(core: SessionCore, target: Target, chunk: ChapterChunk): void {
  const last = Math.max(chunk.sentences.length - 1, 0);
  const sentence =
    target.page === undefined
      ? clamp(target.sentence, 0, last)
      : sentenceOfPage(chunk, target.page);
  aim(core, { chapter: target.chapter, sentence });
  if (core.wantsPlay) {
    startSpeaking(core, advance).catch(() => fail(core, 'speech'));
  } else {
    newToken(core);
    update(core, {
      status: 'paused',
      error: null,
      waiting: false,
      incomplete: false,
    });
    if (!core.restoring) {
      report(core, 'now');
    }
    core.restoring = false;
  }
}

async function load(core: SessionCore, target: Target): Promise<void> {
  silence(core);
  const { token } = core;
  update(core, {
    status: 'loading',
    error: null,
    waiting: false,
    incomplete: false,
  });
  let chunk: ChapterChunk | null = null;
  try {
    chunk = (await core.cache?.get(target.chapter)) ?? null;
  } catch {
    // Told as a missing text: both are retried the same way
  }
  if (token !== core.token) {
    return;
  }
  if (chunk === null || chunk.sentences.length === 0) {
    fail(core, 'text');
  } else {
    settle(core, target, chunk);
  }
}

/** Goes to the target and reads it aloud if `wantsPlay`. Synchronous for a chapter in memory. */
export function enter(core: SessionCore, target: Target): void {
  aim(core, target);
  const chunk = core.cache?.peek(target.chapter) ?? null;
  if (chunk === null) {
    load(core, target);
  } else {
    // Counts as a use, so it isn't the next one to be forgotten
    core.cache?.prefetch(target.chapter);
    settle(core, target, chunk);
  }
}

/** The sentence after, by the text itself where it is loaded: the toc only counts. */
export function following(core: SessionCore): Position | null {
  const { position } = core.snapshot;
  if (position === null || core.book === null) {
    return null;
  }
  const sentences = currentChunk(core)?.sentences.length ?? 0;
  if (position.sentence + 1 < sentences) {
    return { ...position, sentence: toSentenceIndex(position.sentence + 1) };
  }
  const next = nextChapter(core.book.toc, position.chapter);
  return next && { chapter: next.index, sentence: toSentenceIndex(0) };
}

/** Nothing is saved after the current sentence. */
export function reachEnd(core: SessionCore): void {
  silence(core);
  const completeness = core.book?.completeness ?? 'incomplete';
  if (completeness === 'importing') {
    update(core, { status: 'loading', waiting: true, error: null });
    report(core, 'now');
    return;
  }
  core.wantsPlay = false;
  const complete = completeness === 'complete';
  update(core, {
    status: 'ended',
    waiting: false,
    incomplete: !complete,
    error: null,
    sleep: SLEEP_OFF,
  });
  report(core, 'now', complete);
}

/** A sentence was read to its end. */
export function advance(core: SessionCore): void {
  const { position, sleep } = core.snapshot;
  const next = following(core);
  const due = isSleepDue(sleep, {
    now: core.ports.now(),
    endsChapter: next?.chapter !== position?.chapter,
  });
  if (due) {
    silence(core);
    core.wantsPlay = false;
    core.pausedAt = core.ports.now();
    update(core, { sleep: SLEEP_OFF });
  }
  if (next === null) {
    reachEnd(core);
  } else {
    enter(core, next);
  }
}

/** Moves by sentences. Before the first one, that one starts again; after the last, nothing. */
export function seekSentence(core: SessionCore, delta: number): void {
  const { book } = core;
  const from = core.snapshot.position;
  if (book === null || from === null) {
    return;
  }
  let target = from;
  for (let step = 0; step < Math.abs(delta); step += 1) {
    target =
      (delta > 0
        ? nextPosition(book.toc, target)
        : previousPosition(book.toc, target)) ?? target;
  }
  if (delta < 0 || target !== from) {
    enter(core, target);
  }
}

/** Goes to the first sentence of a page, among the saved chapters. */
export function seekPage(core: SessionCore, page: number): void {
  const chapter = chapterOfPage(core.book?.toc ?? [], page);
  if (chapter !== null) {
    enter(core, { chapter: chapter.index, sentence: 0, page });
  }
}
