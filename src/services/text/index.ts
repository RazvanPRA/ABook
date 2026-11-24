// Public API of services/text: pure text functions used by the import pipeline.
export type { PageLine, PageText } from './types';
export {
  HEADER_SAMPLE_PAGES,
  detectRepeatedHeaders,
} from './detectRepeatedHeaders';
export { stripRepeatedHeaders } from './stripRepeatedHeaders';
export { stripPageNumbers } from './stripPageNumbers';
export {
  MIN_NUMBERED_HEADER_PAGES,
  printedPageOffset,
  stripNumberedRunningHeaders,
} from './stripNumberedRunningHeaders';
export {
  MIN_CHAPTER_HEADER_PAGES,
  detectChapterHeaders,
  stripChapterRunningHeaders,
} from './stripChapterRunningHeaders';
export { joinHyphenatedWords } from './joinHyphenatedWords';
export { normalizeDiacritics } from './normalizeDiacritics';
export { normalizeWhitespace } from './normalizeWhitespace';
export { expandLigatures } from './expandLigatures';
export { segmentSentences } from './segmentSentences';
export type { Sentence } from './segmentSentences';
export { MAX_SENTENCE_CHARS, splitLongSentence } from './splitLongSentence';
export type { ChapterRange, ChapterStart } from './chapterRanges';
export { rangesFromStarts } from './chapterRanges';
export type { OutlineItem } from './chaptersFromOutline';
export { chaptersFromOutline } from './chaptersFromOutline';
export { findChapterHeading, isHeadingLine } from './findChapterHeading';
export {
  PAGES_PER_FIXED_CHAPTER,
  fixedPageChapters,
} from './fixedPageChapters';
export { medianLineHeight } from './medianLineHeight';
export { buildChapterChunk } from './buildChapterChunk';
export { toChapter } from './toChapter';
