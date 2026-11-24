/** Longest sentence sent to the TTS as one utterance; longer ones are split so playback stays responsive. */
export const MAX_SENTENCE_CHARS = 400;

/** `;` or `,` followed by whitespace: `3,5` (decimal comma) is not a split point. */
const PUNCTUATION_SPLIT = /[;,](?=\s)/g;

const SPACE = /\s/g;

/**
 * Splits a sentence longer than `maxChars` into parts of at most `maxChars` characters, recursively:
 * after the `;` or `,` closest to the middle (the mark stays with the first part), else at the space
 * closest to the middle. A run of more than `maxChars` characters without spaces (a URL, extraction
 * garbage) is cut at `maxChars` as a last resort. Parts are trimmed; a short sentence is returned
 * as is.
 */
export function splitLongSentence(
  sentence: string,
  maxChars = MAX_SENTENCE_CHARS,
): string[] {
  const text = sentence.trim();
  if (text.length <= maxChars) {
    return text === '' ? [] : [text];
  }
  const at = splitPoint(text, maxChars);
  return [
    ...splitLongSentence(text.slice(0, at), maxChars),
    ...splitLongSentence(text.slice(at), maxChars),
  ];
}

/** Where to cut: right after the chosen punctuation, at the chosen space, or at `maxChars`. */
function splitPoint(text: string, maxChars: number): number {
  const middle = text.length / 2;
  const afterPunctuation = positions(text, PUNCTUATION_SPLIT).map(i => i + 1);
  const candidates =
    afterPunctuation.length > 0 ? afterPunctuation : positions(text, SPACE);
  return candidates.length > 0 ? closestTo(candidates, middle) : maxChars;
}

function positions(text: string, pattern: RegExp): number[] {
  return [...text.matchAll(pattern)].map(match => match.index);
}

function closestTo(values: readonly number[], target: number): number {
  return values.reduce((best, value) =>
    Math.abs(value - target) < Math.abs(best - target) ? value : best,
  );
}
