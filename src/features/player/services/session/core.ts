import type { ChapterChunk } from '@/shared/domain';
import { createSpeechMeter } from '../speechMeter';
import {
  IDLE,
  type ReportUrgency,
  type SessionCore,
  type SessionPorts,
  type SessionSnapshot,
} from './types';

export const createCore = (ports: SessionPorts): SessionCore => ({
  ports,
  meter: createSpeechMeter(),
  snapshot: IDLE,
  book: null,
  cache: null,
  token: 0,
  wantsPlay: false,
  voiceId: undefined,
  pickedFor: null,
  pausedAt: null,
  restoring: false,
  reportedChapter: null,
});

/** Changes the snapshot and tells the outside, if anything is different. */
export function update(
  core: SessionCore,
  patch: Partial<SessionSnapshot>,
): void {
  const before = core.snapshot;
  const next = { ...before, ...patch };
  const keys = Object.keys(patch) as (keyof SessionSnapshot)[];
  if (keys.some(key => before[key] !== next[key])) {
    core.snapshot = next;
    core.ports.onChange(next);
  }
}

/** From now on, the callbacks of what was asked before are ignored. */
export function newToken(core: SessionCore): number {
  core.token += 1;
  return core.token;
}

/** The text of the current chapter, if it is in memory. */
export function currentChunk(core: SessionCore): ChapterChunk | null {
  const { position } = core.snapshot;
  return position === null
    ? null
    : (core.cache?.peek(position.chapter) ?? null);
}

export function silence(core: SessionCore): void {
  newToken(core);
  // Nothing to do about an engine that can't even stop
  core.ports.engine.stop().catch(() => {});
}

/**
 * Hands the position over to be stored; nothing to store before a chapter is loaded. A new chapter
 * is never stored later.
 */
export function report(
  core: SessionCore,
  urgency: ReportUrgency,
  finished = false,
): void {
  const { bookId, position, page, loaded } = core.snapshot;
  if (bookId === null || position === null || page === null || !loaded) {
    return;
  }
  const moved = core.reportedChapter !== position.chapter;
  core.reportedChapter = position.chapter;
  core.ports.reportProgress(
    bookId,
    {
      ...position,
      page,
      finished,
      updatedAt: new Date(core.ports.now()).toISOString(),
    },
    moved ? 'now' : urgency,
  );
}
