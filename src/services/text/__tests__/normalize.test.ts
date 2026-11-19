import { expandLigatures } from '../expandLigatures';
import { charFromCode } from '../letters';
import { normalizeDiacritics } from '../normalizeDiacritics';
import { normalizeWhitespace } from '../normalizeWhitespace';

// Invisible and look-alike characters as code points (see `charFromCode`).
const BREVE = charFromCode(0x0306);
const CIRCUMFLEX = charFromCode(0x0302);
const COMMA_BELOW = charFromCode(0x0326);
const CEDILLA = charFromCode(0x0327);
const S_CEDILLA = charFromCode(0x015f);
const T_CEDILLA = charFromCode(0x0163);
const S_CEDILLA_UPPER = charFromCode(0x015e);
const T_CEDILLA_UPPER = charFromCode(0x0162);
const NBSP = charFromCode(0x00a0);
const NARROW_NBSP = charFromCode(0x202f);
const EN_SPACE = charFromCode(0x2002);
const EM_SPACE = charFromCode(0x2003);
const THIN_SPACE = charFromCode(0x2009);
const HAIR_SPACE = charFromCode(0x200a);
const IDEOGRAPHIC_SPACE = charFromCode(0x3000);
const SOFT_HYPHEN = charFromCode(0x00ad);
const ZWSP = charFromCode(0x200b);
const ZWNJ = charFromCode(0x200c);
const ZWJ = charFromCode(0x200d);
const WORD_JOINER = charFromCode(0x2060);
const BOM = charFromCode(0xfeff);

describe('normalizeDiacritics', () => {
  it.each([
    [
      'cedilla ş ţ',
      `${S_CEDILLA_UPPER}tiin${T_CEDILLA}a ${S_CEDILLA}i ${T_CEDILLA}ara`,
      'Știința și țara',
    ],
    [
      'cedilla uppercase',
      `${S_CEDILLA_UPPER}TIIN${T_CEDILLA_UPPER}Ă`,
      'ȘTIINȚĂ',
    ],
    ['already comma below', 'Știința și țara', 'Știința și țara'],
    [
      'combining breve and circumflex',
      `ma${BREVE}r, ca${CIRCUMFLEX}nd, i${CIRCUMFLEX}n`,
      'măr, când, în',
    ],
    [
      'combining uppercase',
      `A${BREVE}, A${CIRCUMFLEX}, I${CIRCUMFLEX}`,
      'Ă, Â, Î',
    ],
    [
      'combining comma below',
      `s${COMMA_BELOW}i t${COMMA_BELOW}ara, S${COMMA_BELOW}, T${COMMA_BELOW}`,
      'și țara, Ș, Ț',
    ],
    [
      'combining cedilla',
      `s${CEDILLA}i t${CEDILLA}ara, S${CEDILLA}, T${CEDILLA}`,
      'și țara, Ș, Ț',
    ],
    ['mixed forms', `${S_CEDILLA_UPPER}i s${CEDILLA}i și`, 'Și și și'],
    ['text without diacritics', 'Ion merge acasa.', 'Ion merge acasa.'],
    ['empty text', '', ''],
  ])('%s', (_, input, expected) => {
    expect(normalizeDiacritics(input)).toBe(expected);
  });

  it('produces exactly the comma-below code points', () => {
    expect(normalizeDiacritics(`${S_CEDILLA}${T_CEDILLA}`)).toBe(
      charFromCode(0x0219) + charFromCode(0x021b),
    );
  });

  it('leaves other letters with cedilla alone', () => {
    expect(normalizeDiacritics('Façade, garçon')).toBe('Façade, garçon');
  });
});

describe('normalizeWhitespace', () => {
  it.each([
    ['collapses runs of spaces', 'Era   o    zi', 'Era o zi'],
    ['trims', '  Era o zi  ', 'Era o zi'],
    ['tabs and newlines', 'Era\to\nzi\r\nfrumoasă', 'Era o zi frumoasă'],
    [
      'NBSP and narrow NBSP',
      `nr.${NBSP}12 și 5${NARROW_NBSP}%`,
      'nr. 12 și 5 %',
    ],
    [
      'Unicode spaces',
      `a${EN_SPACE}b${EM_SPACE}c${THIN_SPACE}d${HAIR_SPACE}e${IDEOGRAPHIC_SPACE}f`,
      'a b c d e f',
    ],
    ['soft hyphen inside a word', `dimi${SOFT_HYPHEN}neața`, 'dimineața'],
    [
      'zero-width characters',
      `${BOM}Era${ZWSP} o${ZWNJ} z${ZWJ}i${WORD_JOINER}`,
      'Era o zi',
    ],
    ['only whitespace', ` ${NBSP}\t\n `, ''],
    ['empty text', '', ''],
  ])('%s', (_, input, expected) => {
    expect(normalizeWhitespace(input)).toBe(expected);
  });
});

describe('expandLigatures', () => {
  it.each([
    ['ﬁ', `${charFromCode(0xfb01)}nal`, 'final'],
    ['ﬂ', `${charFromCode(0xfb02)}oare`, 'floare'],
    ['ﬀ', `e${charFromCode(0xfb00)}ect`, 'effect'],
    ['ﬃ', `su${charFromCode(0xfb03)}x`, 'suffix'],
    ['ﬄ', `ba${charFromCode(0xfb04)}e`, 'baffle'],
    ['ﬅ and ﬆ', `po${charFromCode(0xfb05)} ${charFromCode(0xfb06)}`, 'post st'],
    [
      'several in one text',
      `${charFromCode(0xfb01)}re ${charFromCode(0xfb02)}ori ${charFromCode(0xfb01)}re`,
      'fire flori fire',
    ],
    ['no ligatures', 'floare', 'floare'],
    ['empty text', '', ''],
  ])('%s', (_, input, expected) => {
    expect(expandLigatures(input)).toBe(expected);
  });
});
