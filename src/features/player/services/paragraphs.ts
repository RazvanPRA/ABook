import type { ChapterChunk } from '@/shared/domain';
import type { Paragraph } from '../model/types';

/** A paragraph this long ends with its sentence, so the list stays smooth and scrolls precisely. */
export const PARAGRAPH_LENGTH = 600;

const DIALOGUE = /^[—–]/;

/**
 * Groups a chapter's sentences into paragraphs. The stored text has no paragraphs, so they are
 * guessed: a new one at a page change, at a dialogue line and after `PARAGRAPH_LENGTH` characters.
 * A sentence is never split.
 */
export function groupParagraphs({
  sentences,
  sentencePages,
}: ChapterChunk): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  let first = 0;
  let length = 0;
  sentences.forEach((sentence, index) => {
    const starts =
      sentencePages[index] !== sentencePages[index - 1] ||
      DIALOGUE.test(sentence) ||
      length >= PARAGRAPH_LENGTH;
    if (starts && index > first) {
      paragraphs.push({ first, end: index });
      first = index;
      length = 0;
    }
    length += sentence.length;
  });
  return sentences.length === 0
    ? []
    : [...paragraphs, { first, end: sentences.length }];
}

/** The paragraph a sentence is in; -1 when it is in none. */
export const paragraphOf = (
  paragraphs: readonly Paragraph[],
  sentence: number,
): number =>
  paragraphs.findIndex(({ first, end }) => sentence >= first && sentence < end);
