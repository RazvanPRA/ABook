/** Enough of a sentence to recognize it in the bookmark list. */
export const EXCERPT_LENGTH = 120;

/** The beginning of a sentence, cut between words. */
export function makeExcerpt(sentence: string): string {
  const text = sentence.trim();
  if (text.length <= EXCERPT_LENGTH) {
    return text;
  }
  const space = text.lastIndexOf(' ', EXCERPT_LENGTH);
  return `${text.slice(0, space > 0 ? space : EXCERPT_LENGTH)}…`;
}
