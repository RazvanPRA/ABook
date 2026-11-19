import { ABBREVIATIONS } from './abbreviations';
import { isLetter, isUppercaseLetter } from './letters';

/** A sentence and the offset of its first character in the segmented text. */
export interface Sentence {
  readonly text: string;
  readonly start: number;
}

/**
 * A candidate boundary: sentence punctuation (`.` `!` `?` `…`, repeated or mixed: `?!`, `...`),
 * closing quotes or brackets that belong to the sentence, then whitespace.
 */
const BOUNDARY = /[.!?…]+[”"»’')\]]*\s+/g;

/** What may come before the first letter of a new sentence: opening quotes, dialogue dashes. */
const SENTENCE_OPENERS = /^[„«“"'([—–-]*\s*/;

/** Opening punctuation stripped from the word before a period, so `(n.r.` gives `n.r`. */
const WORD_OPENERS = /^[„«“"'([—–-]+/;

/** A candidate boundary found by `BOUNDARY`. */
interface Candidate {
  /** Where the punctuation starts. */
  readonly at: number;
  /** The punctuation and closing quotes, without the whitespace. */
  readonly punctuation: string;
  /** Where the next sentence would start (after the whitespace). */
  readonly next: number;
}

/**
 * Splits text (already cleaned and normalized) into sentences. A boundary is sentence punctuation
 * followed by whitespace and then by an uppercase letter, possibly after opening quotes or a dialogue
 * dash. Not a boundary: a lowercase continuation (`„Vino!” zise el.`, `— Vino! — strigă mama.`,
 * `Și apoi… a plecat.`), a period after a known abbreviation (`dl.`, `nr.`, `ș.a.m.d.`) or after a
 * single letter (initials: `I. L. Caragiale`). Closing quotes stay with their sentence.
 */
export function segmentSentences(text: string): Sentence[] {
  const sentences: Sentence[] = [];
  let start = 0;
  for (const match of text.matchAll(BOUNDARY)) {
    const candidate: Candidate = {
      at: match.index,
      punctuation: match[0].trimEnd(),
      next: match.index + match[0].length,
    };
    if (isBoundary(text, candidate)) {
      const end = candidate.at + candidate.punctuation.length;
      sentences.push(...toSentence(text, start, end));
      start = candidate.next;
    }
  }
  sentences.push(...toSentence(text, start, text.length));
  return sentences;
}

function isBoundary(text: string, candidate: Candidate): boolean {
  const firstLetter = text
    .slice(candidate.next)
    .replace(SENTENCE_OPENERS, '')
    .charAt(0);
  if (!isUppercaseLetter(firstLetter)) {
    return false;
  }
  const { punctuation } = candidate;
  const singlePeriod =
    punctuation.startsWith('.') && !punctuation.startsWith('..');
  return !(singlePeriod && isAbbreviation(wordBefore(text, candidate.at)));
}

/** The word that ends right before `index`, without its opening punctuation, lowercased. */
function wordBefore(text: string, index: number): string {
  const before = text.slice(0, index);
  const word = before.slice(before.search(/\S*$/));
  return word.replace(WORD_OPENERS, '').toLowerCase();
}

function isAbbreviation(word: string): boolean {
  return ABBREVIATIONS.has(word) || (word.length === 1 && isLetter(word));
}

/** The sentence between `from` and `to`, trimmed; none when that range is blank. */
function toSentence(text: string, from: number, to: number): Sentence[] {
  const raw = text.slice(from, to);
  const trimmed = raw.trim();
  return trimmed === ''
    ? []
    : [{ text: trimmed, start: from + raw.search(/\S/) }];
}
