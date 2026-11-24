import type { ChapterChunk, ChapterIndex } from '@/shared/domain';
import type { Position, Toc } from '../model/types';

/** A usual sentence, until one is seen. */
export const DEFAULT_SENTENCE_LENGTH = 90;

const charactersOf = (sentences: readonly string[]) =>
  sentences.reduce((sum, sentence) => sum + sentence.length, 0);

function averageLength(chunks: readonly ChapterChunk[]): number {
  const count = chunks.reduce((sum, own) => sum + own.sentences.length, 0);
  const characters = chunks.reduce(
    (sum, own) => sum + charactersOf(own.sentences),
    0,
  );
  return count === 0 ? DEFAULT_SENTENCE_LENGTH : characters / count;
}

/**
 * Characters left from the current sentence on: exact in the chapters in memory, elsewhere their
 * sentences times the average length in memory.
 */
export function remainingCharacters(
  toc: Toc,
  { chapter, sentence }: Position,
  peek: (chapter: ChapterIndex) => ChapterChunk | null,
): number {
  const left = toc.slice(chapter);
  const loaded = left.flatMap(({ index }) => peek(index) ?? []);
  const average = averageLength(loaded);
  return left.reduce((sum, { index, sentenceCount }) => {
    const from = index === chapter ? sentence : 0;
    const chunk = peek(index);
    return (
      sum +
      (chunk
        ? charactersOf(chunk.sentences.slice(from))
        : Math.max(sentenceCount - from, 0) * average)
    );
  }, 0);
}
