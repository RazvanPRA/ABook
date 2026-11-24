// Letter-case helpers without Unicode property escapes (`\p{L}`), so they don't depend on the regex
// support of the JS engine (Hermes).

/** The character has an upper and a lower case form, so it is a letter of a cased alphabet. */
export function isLetter(char: string): boolean {
  return char.toLowerCase() !== char.toUpperCase();
}

export function isLowercaseLetter(char: string): boolean {
  return isLetter(char) && char === char.toLowerCase();
}

export function isUppercaseLetter(char: string): boolean {
  return isLetter(char) && char === char.toUpperCase();
}

/**
 * The character with this UTF-16 code. Invisible or look-alike characters (combining marks, soft
 * hyphen, zero-width space) are written as code points: Prettier 3.10 turns `\uXXXX` escapes in
 * strings into the literal characters, which can't be told apart in the source.
 */
export function charFromCode(code: number): string {
  return String.fromCharCode(code);
}

const VOWELS = new Set('aăâeiîouy');

/** The word contains at least one vowel (Romanian or English), so it can be a syllable. */
export function hasVowel(word: string): boolean {
  return [...word.toLowerCase()].some(char => VOWELS.has(char));
}
