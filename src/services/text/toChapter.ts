import {
  type Chapter,
  type ChapterChunk,
  toChapterIndex,
  toPageNumber,
} from '@/shared/domain';
import type { ChapterRange } from './chapterRanges';

/** The table-of-contents entry for a chapter, once its chunk is built. */
export function toChapter(
  index: number,
  range: ChapterRange,
  chunk: ChapterChunk,
): Chapter {
  return {
    index: toChapterIndex(index),
    title: range.title,
    startPage: toPageNumber(range.startPage),
    endPage: toPageNumber(range.endPage),
    sentenceCount: chunk.sentences.length,
  };
}
