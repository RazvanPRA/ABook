/** Stable identifier of an imported book (UUID). Branded so it cannot be mixed with other strings. */
export type BookId = string & { readonly __brand: 'BookId' };

/** 1-based page number of the source PDF. */
export type PageNumber = number & { readonly __brand: 'PageNumber' };

/** 0-based position of a chapter in the table of contents. */
export type ChapterIndex = number & { readonly __brand: 'ChapterIndex' };

/** 0-based position of a sentence inside its chapter. */
export type SentenceIndex = number & { readonly __brand: 'SentenceIndex' };

export const toBookId = (value: string): BookId => value as BookId;
export const toPageNumber = (value: number): PageNumber => value as PageNumber;
export const toChapterIndex = (value: number): ChapterIndex =>
  value as ChapterIndex;
export const toSentenceIndex = (value: number): SentenceIndex =>
  value as SentenceIndex;
