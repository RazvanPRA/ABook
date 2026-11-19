// Public API of services/text: pure text functions used by the import pipeline.
export type { PageLine, PageText } from './types';
export {
  HEADER_SAMPLE_PAGES,
  detectRepeatedHeaders,
} from './detectRepeatedHeaders';
export { stripRepeatedHeaders } from './stripRepeatedHeaders';
export { stripPageNumbers } from './stripPageNumbers';
export { joinHyphenatedWords } from './joinHyphenatedWords';
export { normalizeDiacritics } from './normalizeDiacritics';
export { normalizeWhitespace } from './normalizeWhitespace';
export { expandLigatures } from './expandLigatures';
export { segmentSentences } from './segmentSentences';
export type { Sentence } from './segmentSentences';
