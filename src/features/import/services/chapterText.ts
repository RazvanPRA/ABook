import {
  buildChapterChunk,
  stripChapterRunningHeaders,
  stripPageNumbers,
  stripRepeatedHeaders,
} from '@/services/text';
import type { ChapterChunk } from '@/shared/domain';
import type { ChapterDraft } from './chapterAssembler';

/**
 * The sentences of a completed chapter, cleaned in the order checked on the real samples (M3
 * steps 11–11a): book-wide headers learned from the first pages, then the chapter's own running
 * heads, then page numbers; `buildChapterChunk` joins hyphenated words, normalizes and segments.
 */
export function chapterText(
  draft: ChapterDraft,
  bookHeaders: ReadonlySet<string>,
): ChapterChunk {
  const withoutBookHeaders = stripRepeatedHeaders(draft.pages, bookHeaders);
  const withoutRunningHeads = stripChapterRunningHeaders(withoutBookHeaders);
  return buildChapterChunk(stripPageNumbers(withoutRunningHeads));
}
