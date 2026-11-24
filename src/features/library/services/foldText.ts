import { normalizeDiacritics } from '@/services/text';

/** Lowercase letters with diacritics → the plain letter, for Romanian and its neighbors. */
const PLAIN: ReadonlyMap<string, string> = new Map(
  Object.entries({
    a: 'ăâàáäãå',
    c: 'ç',
    e: 'èéêë',
    i: 'îìíï',
    n: 'ñ',
    o: 'òóôöõő',
    s: 'ș',
    t: 'ț',
    u: 'ùúûüű',
  }).flatMap(([plain, accented]) =>
    [...accented].map(letter => [letter, plain] as const),
  ),
);

const FIRST_COMBINING_MARK = 0x0300;
const LAST_COMBINING_MARK = 0x036f;

const isCombiningMark = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return code >= FIRST_COMBINING_MARK && code <= LAST_COMBINING_MARK;
};

/**
 * Text as the search compares it: lowercase, without diacritics (cedilla and decomposed forms
 * included). Doesn't use `String.normalize`, which Hermes doesn't guarantee.
 */
export function foldText(text: string): string {
  return [...normalizeDiacritics(text).toLowerCase()]
    .filter(char => !isCombiningMark(char))
    .map(char => PLAIN.get(char) ?? char)
    .join('');
}
