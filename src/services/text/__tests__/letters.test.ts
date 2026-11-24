import {
  charFromCode,
  hasVowel,
  isLetter,
  isLowercaseLetter,
  isUppercaseLetter,
} from '../letters';

describe('letters', () => {
  it.each([
    ['a', true, true, false],
    ['ș', true, true, false],
    ['ă', true, true, false],
    ['Ț', true, false, true],
    ['Î', true, false, true],
    ['Z', true, false, true],
    ['1', false, false, false],
    ['-', false, false, false],
    ['—', false, false, false],
    ['„', false, false, false],
    [' ', false, false, false],
    ['', false, false, false],
  ])(
    '%p: letter %p, lowercase %p, uppercase %p',
    (char, letter, lower, upper) => {
      expect(isLetter(char)).toBe(letter);
      expect(isLowercaseLetter(char)).toBe(lower);
      expect(isUppercaseLetter(char)).toBe(upper);
    },
  );

  it('charFromCode builds a character from its code point', () => {
    expect(charFromCode(0x0219)).toBe('ș');
    expect(charFromCode(0x00ad)).toHaveLength(1);
  });

  it.each([
    ['cuvân', true],
    ['ÎN', true],
    ['y', true],
    ['s', false],
    ['într', true],
    ['ntr', false],
    ['', false],
  ])('hasVowel(%p) = %p', (word, expected) => {
    expect(hasVowel(word)).toBe(expected);
  });
});
