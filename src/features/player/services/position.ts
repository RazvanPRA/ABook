import {
  toChapterIndex,
  toSentenceIndex,
  type Chapter,
  type PageNumber,
} from '@/shared/domain';
import type { ChapterChunk } from '@/shared/domain';
import { clamp } from '@/shared/utils';
import type { Position, Toc } from '../model/types';

const at = (chapter: number, sentence: number): Position => ({
  chapter: toChapterIndex(chapter),
  sentence: toSentenceIndex(sentence),
});

const hasText = ({ sentenceCount }: Chapter) => sentenceCount > 0;

const firstOf = ({ index }: Chapter) => at(index, 0);
const lastOf = ({ index, sentenceCount }: Chapter) =>
  at(index, sentenceCount - 1);

/** The next chapter with text, after `chapter`. */
export function nextChapter(toc: Toc, chapter: number): Chapter | null {
  return toc.slice(chapter + 1).find(hasText) ?? null;
}

function previousChapter(toc: Toc, chapter: number): Chapter | null {
  return toc.slice(0, Math.max(chapter, 0)).reverse().find(hasText) ?? null;
}

/** The first sentence of the book; `null` while nothing is saved. */
export function firstPosition(toc: Toc): Position | null {
  const chapter = nextChapter(toc, -1);
  return chapter === null ? null : firstOf(chapter);
}

/** The sentence after, across chapters; `null` at the end of what is saved. */
export function nextPosition(
  toc: Toc,
  { chapter, sentence }: Position,
): Position | null {
  if (sentence + 1 < (toc[chapter]?.sentenceCount ?? 0)) {
    return at(chapter, sentence + 1);
  }
  const next = nextChapter(toc, chapter);
  return next === null ? null : firstOf(next);
}

/** The sentence before, across chapters; `null` at the beginning. */
export function previousPosition(
  toc: Toc,
  { chapter, sentence }: Position,
): Position | null {
  if (sentence > 0) {
    return at(chapter, sentence - 1);
  }
  const previous = previousChapter(toc, chapter);
  return previous === null ? null : lastOf(previous);
}

/** The closest position with text; `null` while nothing is saved. */
export function clampPosition(
  toc: Toc,
  { chapter, sentence }: Position,
): Position | null {
  const own = toc[chapter];
  if (own && hasText(own)) {
    return at(chapter, clamp(sentence, 0, own.sentenceCount - 1));
  }
  const after = nextChapter(toc, chapter);
  if (after !== null) {
    return firstOf(after);
  }
  const before = previousChapter(toc, Math.min(chapter, toc.length));
  return before === null ? null : lastOf(before);
}

/** The first chapter with text that reaches the page; the last one for a page after all of them. */
export function chapterOfPage(toc: Toc, page: number): Chapter | null {
  const chapters = toc.filter(hasText);
  return (
    chapters.find(({ endPage }) => endPage >= page) ??
    chapters[chapters.length - 1] ??
    null
  );
}

/** The first sentence on the page or after it; the last one when the text ends before. */
export function sentenceOfPage(
  { sentencePages }: ChapterChunk,
  page: number,
): number {
  const index = sentencePages.findIndex(own => own >= page);
  return index === -1 ? Math.max(sentencePages.length - 1, 0) : index;
}

/** The page of a position; its chapter's first one until the text is loaded. */
export function pageOf(
  toc: Toc,
  { chapter, sentence }: Position,
  chunk: ChapterChunk | null,
): PageNumber | null {
  return chunk?.sentencePages[sentence] ?? toc[chapter]?.startPage ?? null;
}
