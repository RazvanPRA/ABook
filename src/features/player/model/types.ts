import type { Chapter, ChapterIndex, SentenceIndex } from '@/shared/domain';

/** Where listening is: a sentence of a chapter. */
export interface Position {
  readonly chapter: ChapterIndex;
  readonly sentence: SentenceIndex;
}

/** The saved chapters of a book, in order. */
export type Toc = readonly Chapter[];

/** Sentences read as one block of text: `first` up to, not including, `end`. */
export interface Paragraph {
  readonly first: number;
  readonly end: number;
}
