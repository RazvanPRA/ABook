import { FakeTtsEngine } from '@/services/tts/testing';
import type { ChapterChunk, Progress } from '@/shared/domain';
import { BOOK_IDS } from '@/shared/domain/__fixtures__/books';
import {
  createPlaybackSession,
  type SessionBook,
  type SessionSnapshot,
} from '../services/session';
import { makeText, makeToc, position, type ChapterPages } from './chapters';

/** Two pages, one page, two pages. */
export const CHAPTERS: readonly ChapterPages[] = [
  [1, 1, 2],
  [3, 3],
  [4, 5],
];

const [A] = BOOK_IDS;

export const makeBook = (
  chapters: readonly ChapterPages[] = CHAPTERS,
  overrides: Partial<SessionBook> = {},
): SessionBook => ({
  id: A ?? ('' as SessionBook['id']),
  language: 'ro-RO',
  completeness: 'complete',
  toc: makeToc(chapters),
  ...overrides,
});

/** Lets the pending reads and voice lists answer. */
export const settle = async (): Promise<void> => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
};

/** A session over a fake voice, a clock that only `tick` moves and chapters in memory. */
export function setupSession(
  chapters: Partial<Record<number, ChapterPages>> = { ...CHAPTERS },
) {
  const engine = new FakeTtsEngine();
  const settings = { voiceId: null as string | null, rate: 1, pitch: 1 };
  const reports: (Progress & { urgency: string })[] = [];
  const snapshots: SessionSnapshot[] = [];
  let now = Date.parse('2026-11-24T10:00:00.000Z');
  const readChapter = jest.fn(
    async (_id: string, chapter: number): Promise<ChapterChunk | null> => {
      const pages = chapters[chapter];
      return pages ? makeText(chapter, pages) : null;
    },
  );
  const session = createPlaybackSession({
    engine,
    readChapter,
    settings: () => settings,
    now: () => now,
    reportProgress: (_id, progress, urgency) =>
      reports.push({ ...progress, urgency }),
    onChange: snapshot => snapshots.push(snapshot),
  });
  const start = async (
    book: SessionBook = makeBook(),
    [chapter, sentence]: [number, number] = [0, 0],
  ) => {
    session.open(book, { at: position(chapter, sentence), play: true });
    await settle();
  };
  return {
    engine,
    session,
    settings,
    reports,
    snapshots,
    readChapter,
    start,
    tick: (ms: number) => {
      now += ms;
    },
    /** Where it is, as `chapter.sentence`. */
    where: () => {
      const { position: at } = session.snapshot();
      return at ? `${at.chapter}.${at.sentence}` : null;
    },
    status: () => session.snapshot().status,
    last: () => reports[reports.length - 1],
  };
}
