// Public API of services/text: pure text functions used by the import pipeline.
export type { PageLine, PageText } from './types';
export {
  HEADER_SAMPLE_PAGES,
  detectRepeatedHeaders,
} from './detectRepeatedHeaders';
export { stripRepeatedHeaders } from './stripRepeatedHeaders';
export { stripPageNumbers } from './stripPageNumbers';
