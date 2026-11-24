import { charFromCode } from './letters';

const BREVE = charFromCode(0x0306);
const CIRCUMFLEX = charFromCode(0x0302);
const COMMA_BELOW = charFromCode(0x0326);
const CEDILLA = charFromCode(0x0327);

/**
 * Decomposed letters (base + combining mark) → the precomposed Romanian letters, without
 * `String.prototype.normalize` (it needs Intl, which Hermes doesn't guarantee). The combining
 * cedilla under s/t means comma below, as in the precomposed case. Applied first.
 */
const COMBINED: readonly (readonly [string, string])[] = [
  ['a' + BREVE, 'ă'],
  ['A' + BREVE, 'Ă'],
  ['a' + CIRCUMFLEX, 'â'],
  ['A' + CIRCUMFLEX, 'Â'],
  ['i' + CIRCUMFLEX, 'î'],
  ['I' + CIRCUMFLEX, 'Î'],
  ['s' + COMMA_BELOW, 'ș'],
  ['S' + COMMA_BELOW, 'Ș'],
  ['t' + COMMA_BELOW, 'ț'],
  ['T' + COMMA_BELOW, 'Ț'],
  ['s' + CEDILLA, 'ș'],
  ['S' + CEDILLA, 'Ș'],
  ['t' + CEDILLA, 'ț'],
  ['T' + CEDILLA, 'Ț'],
];

/** Romanian letters with cedilla (legacy encodings) → the correct comma-below letters. */
const CEDILLA_TO_COMMA: readonly (readonly [string, string])[] = [
  [charFromCode(0x015f), 'ș'], // ş
  [charFromCode(0x015e), 'Ș'], // Ş
  [charFromCode(0x0163), 'ț'], // ţ
  [charFromCode(0x0162), 'Ț'], // Ţ
];

const REPLACEMENTS = [...COMBINED, ...CEDILLA_TO_COMMA];

/** Unifies Romanian diacritics: ş ţ (cedilla) → ș ț (comma below), decomposed forms → precomposed. */
export function normalizeDiacritics(text: string): string {
  return REPLACEMENTS.reduce(
    (result, [from, to]) => result.split(from).join(to),
    text,
  );
}
