import { charFromCode, hasVowel, isLetter, isLowercaseLetter } from './letters';
import type { PageLine, PageText } from './types';

/** Hyphen-minus, the Unicode hyphen (U+2010) and the soft hyphen (U+00AD); dashes never split words. */
const LINE_END_HYPHENS = new Set([
  '-',
  charFromCode(0x2010),
  charFromCode(0x00ad),
]);

/** `într-o`, `dintr-un`, `printr-o`: the hyphen belongs to the words, not to the line break. */
const CLITIC_PREFIXES = new Set(['într', 'dintr', 'printr']);

interface FlatLine {
  /** The output lines of the page this line belongs to. */
  readonly out: PageLine[];
  readonly source: PageLine;
  text: string;
}

/**
 * Joins words split at the end of a line: `cuvân-` + `tul frumos` → `cuvântul` + `frumos`, only when
 * the line ends with a letter and a hyphen and the next line starts with a lowercase letter. The
 * whole word moves up to the line (and page) where it starts. Works across page boundaries inside
 * `pages`; empty lines are dropped. A fragment that can't be a syllable (no vowel: `s-`, `l-`, or
 * `într-`) keeps its hyphen: `s-` + `a dus` → `s-a` + `dus`.
 */
export function joinHyphenatedWords(pages: readonly PageText[]): PageText[] {
  const result: { page: number; lines: PageLine[] }[] = [];
  const flat: FlatLine[] = [];
  for (const entry of pages) {
    const out: PageLine[] = [];
    result.push({ page: entry.page, lines: out });
    for (const source of entry.lines) {
      flat.push({ out, source, text: source.text });
    }
  }
  joinLines(flat);
  for (const item of flat) {
    if (item.text.trim() !== '') {
      item.out.push({ ...item.source, text: item.text });
    }
  }
  return result;
}

/** Joins in place; a line emptied by a join lets the next one join into the same line. */
function joinLines(flat: readonly FlatLine[]): void {
  let current: FlatLine | undefined;
  for (const line of flat) {
    const joined = current ? joinPair(current.text, line.text) : null;
    if (current && joined) {
      current.text = joined.first;
      line.text = joined.rest;
    }
    if (line.text.trim() !== '') {
      current = line;
    }
  }
}

/** The two lines after joining, or `null` when the first line doesn't end with a split word. */
function joinPair(
  first: string,
  second: string,
): { first: string; rest: string } | null {
  const head = first.trimEnd();
  const tail = second.trimStart();
  if (
    !LINE_END_HYPHENS.has(head.slice(-1)) ||
    !isLetter(head.slice(-2, -1)) ||
    !isLowercaseLetter(tail.charAt(0))
  ) {
    return null;
  }
  const space = tail.search(/\s/);
  const word = space === -1 ? tail : tail.slice(0, space);
  const rest = space === -1 ? '' : tail.slice(space).trimStart();
  const stem = head.slice(0, -1);
  const hyphen = keepsHyphen(lastWord(stem)) ? '-' : '';
  return { first: stem + hyphen + word, rest };
}

function keepsHyphen(fragment: string): boolean {
  const lower = fragment.toLowerCase();
  return CLITIC_PREFIXES.has(lower) || !hasVowel(lower);
}

function lastWord(text: string): string {
  return text.slice(text.search(/\S+$/));
}
