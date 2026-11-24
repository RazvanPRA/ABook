import type { Paragraph } from '../model/types';

/** Where the sentence is put, as a part of the list's height. */
export const TOP_MARGIN = 0.12;
const TOP_THIRD = 1 / 3;

interface SentenceInList {
  readonly paragraph: Paragraph;
  readonly sentence: number;
  /** The paragraph's place in the list. */
  readonly layout: { readonly y: number; readonly height: number };
}

const lengthOf = (sentences: readonly string[]) =>
  sentences.reduce((sum, sentence) => sum + sentence.length, 0);

/** The top of a sentence in the list, estimated inside its paragraph from the characters before it. */
export function sentenceTop(
  sentences: readonly string[],
  { paragraph: { first, end }, sentence, layout }: SentenceInList,
): number {
  const whole = lengthOf(sentences.slice(first, end));
  const before = lengthOf(sentences.slice(first, sentence));
  return layout.y + (whole === 0 ? 0 : (before / whole) * layout.height);
}

/** Whether something at this height of the visible part may stay there. */
export const isInTopThird = (top: number, height: number): boolean =>
  top >= 0 && top <= height * TOP_THIRD;
