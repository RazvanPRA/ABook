import {
  tocSchema,
  toChapterIndex,
  toPageNumber,
  toSentenceIndex,
  type ChapterChunk,
} from '@/shared/domain';
import type { Position, Toc } from '../model/types';

/** Pages of a chapter's sentences: `[1, 1, 2]` is three sentences on two pages. */
export type ChapterPages = readonly number[];

export const position = (chapter: number, sentence: number): Position => ({
  chapter: toChapterIndex(chapter),
  sentence: toSentenceIndex(sentence),
});

/** Sentence `c.s`, e.g. "Fraza 0.2." */
export const sentenceText = (chapter: number, sentence: number): string =>
  `Fraza ${chapter}.${sentence}.`;

export const makeText = (
  chapter: number,
  pages: ChapterPages,
): ChapterChunk => ({
  sentences: pages.map((_, i) => sentenceText(chapter, i)),
  sentencePages: pages.map(toPageNumber),
});

/** The table of contents of these chapters; an empty one takes the page before it. */
export const makeToc = (chapters: readonly ChapterPages[]): Toc => {
  let last = 1;
  return tocSchema.parse(
    chapters.map((pages, index) => {
      const startPage = pages[0] ?? last;
      const endPage = pages[pages.length - 1] ?? startPage;
      last = endPage;
      return {
        index,
        title: `Capitol ${index + 1}`,
        startPage,
        endPage,
        sentenceCount: pages.length,
      };
    }),
  );
};
