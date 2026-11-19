import type { ChapterChunk } from '@/shared/domain';
import { utf8ByteLength } from '@/shared/utils';
import { MAX_VALUE_BYTES } from './limits';

const EMPTY_CHUNK_BYTES = utf8ByteLength(
  JSON.stringify({ sentences: [], sentencePages: [] }),
);

/** Upper bound of what one sentence adds to a serialized chunk: the string, its page, two commas. */
const sentenceCost = (sentence: string, page: number): number =>
  utf8ByteLength(JSON.stringify(sentence)) + String(page).length + 2;

const emptyChunk = (): ChapterChunk => ({ sentences: [], sentencePages: [] });

/**
 * Splits a chapter into parts that each serialize to at most `maxBytes`, keeping `sentences` and
 * `sentencePages` aligned and never cutting a sentence. A chapter that fits stays a single part.
 * A single sentence that cannot fit is a programming error (the text service caps sentence length).
 */
export const splitChapterChunk = (
  chunk: ChapterChunk,
  maxBytes: number = MAX_VALUE_BYTES,
): ChapterChunk[] => {
  if (utf8ByteLength(JSON.stringify(chunk)) <= maxBytes) {
    return [chunk];
  }
  const parts: ChapterChunk[] = [];
  let current = emptyChunk();
  let bytes = EMPTY_CHUNK_BYTES;
  chunk.sentences.forEach((sentence, i) => {
    const page = chunk.sentencePages[i];
    if (page === undefined) {
      throw new Error(`Sentence ${i} has no page (misaligned chunk)`);
    }
    const cost = sentenceCost(sentence, page);
    if (EMPTY_CHUNK_BYTES + cost > maxBytes) {
      throw new Error(`Sentence ${i} alone exceeds ${maxBytes} bytes`);
    }
    if (bytes + cost > maxBytes) {
      parts.push(current);
      current = emptyChunk();
      bytes = EMPTY_CHUNK_BYTES;
    }
    current.sentences.push(sentence);
    current.sentencePages.push(page);
    bytes += cost;
  });
  parts.push(current);
  return parts;
};

/** Inverse of `splitChapterChunk`. */
export const joinChapterParts = (
  parts: readonly ChapterChunk[],
): ChapterChunk => ({
  sentences: parts.flatMap(part => part.sentences),
  sentencePages: parts.flatMap(part => part.sentencePages),
});
