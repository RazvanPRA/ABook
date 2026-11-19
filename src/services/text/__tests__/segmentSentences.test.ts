import { ABBREVIATIONS } from '../abbreviations';
import { segmentSentences } from '../segmentSentences';

function split(text: string): string[] {
  return segmentSentences(text).map(sentence => sentence.text);
}

describe('segmentSentences', () => {
  it.each([
    [
      'plain sentences',
      'Ion iubea pământul. Ana plângea. Toți tăceau!',
      ['Ion iubea pământul.', 'Ana plângea.', 'Toți tăceau!'],
    ],
    [
      'question, exclamation, ellipsis and mixed marks',
      'Unde ești? Vino! Așteaptă… Ce faci?! Gata...',
      ['Unde ești?', 'Vino!', 'Așteaptă…', 'Ce faci?!', 'Gata...'],
    ],
    [
      'Romanian capitals with diacritics',
      'A plecat. Îndată veni. Șeful tăcu. Țara dormea.',
      ['A plecat.', 'Îndată veni.', 'Șeful tăcu.', 'Țara dormea.'],
    ],
    [
      'text without final punctuation',
      'A plecat. Și n-a mai venit',
      ['A plecat.', 'Și n-a mai venit'],
    ],
    [
      'a year before the period',
      'Era în 1907. Atunci a izbucnit răscoala.',
      ['Era în 1907.', 'Atunci a izbucnit răscoala.'],
    ],
  ])('splits %s', (_, text, expected) => {
    expect(split(text)).toEqual(expected);
  });

  it.each([
    [
      'quotes with a lowercase continuation',
      '„Vino aici!” zise el. Apoi plecă.',
      ['„Vino aici!” zise el.', 'Apoi plecă.'],
    ],
    [
      'quotes closing the sentence',
      'El spuse: „Plec mâine.” Nimeni nu răspunse.',
      ['El spuse: „Plec mâine.”', 'Nimeni nu răspunse.'],
    ],
    [
      'a sentence that starts with a quote',
      'A tăcut. „Ce vrei?” întrebă ea.',
      ['A tăcut.', '„Ce vrei?” întrebă ea.'],
    ],
    [
      'guillemets and brackets',
      'Scria «Sfârșit.» Apoi închise cartea (era târziu.) Dormi.',
      ['Scria «Sfârșit.»', 'Apoi închise cartea (era târziu.)', 'Dormi.'],
    ],
  ])('handles %s', (_, text, expected) => {
    expect(split(text)).toEqual(expected);
  });

  it.each([
    [
      'a narrator tag after a dialogue line',
      '— Vino aici! — strigă mama. — Imediat! — răspunse Ion.',
      ['— Vino aici! — strigă mama.', '— Imediat! — răspunse Ion.'],
    ],
    [
      'two dialogue lines in a row',
      '— Bine. — Ce faci mâine? – Nimic.',
      ['— Bine.', '— Ce faci mâine?', '– Nimic.'],
    ],
    [
      'a hyphen used as a dialogue dash',
      '- Unde mergi? - La târg.',
      ['- Unde mergi?', '- La târg.'],
    ],
  ])('handles %s', (_, text, expected) => {
    expect(split(text)).toEqual(expected);
  });

  it.each([
    ['dl.', 'L-am văzut pe dl. Popescu ieri.'],
    ['Dl. at the start', 'Dl. Popescu a venit.'],
    ['d-na', 'A sosit d-na Ionescu.'],
    ['nr.', 'Locuia la nr. 5 din strada mare.'],
    ['pag. and vol.', 'Vezi vol. II, pag. 12 și cap. Trei.'],
    ['etc.', 'Cumpăra cărți, reviste etc. Apoi a plecat.'],
    ['ș.a.', 'Au venit Ion, Ana ș.a. La final, toți au plecat.'],
    ['ș.a.m.d.', 'Mere, pere ș.a.m.d. Toate erau coapte.'],
    ['prof. dr.', 'L-a operat prof. dr. Ionescu.'],
    ['an abbreviation in brackets', 'Textul (n.r. Ziarul) a fost tăiat.'],
    ['î.Hr.', 'În anul 44 î.Hr. Cezar a murit.'],
    ['initials', 'Piesa e scrisă de I. L. Caragiale în 1884.'],
    ['a single initial', 'A scris-o M. Eminescu.'],
    ['English titles', 'He met Mr. Smith and Mrs. Jones.'],
  ])('does not split after %s', (_, text) => {
    expect(split(text)).toEqual([text]);
  });

  it.each([
    [
      'a lowercase continuation',
      'Și apoi… a plecat. Gata.',
      ['Și apoi… a plecat.', 'Gata.'],
    ],
    [
      'a decimal number',
      'Costa 3.5 lei. Era scump.',
      ['Costa 3.5 lei.', 'Era scump.'],
    ],
    [
      'a digit after the period',
      'Vezi nota 3. 4 oameni au venit.',
      ['Vezi nota 3. 4 oameni au venit.'],
    ],
    [
      'no space after the period',
      'Vezi www.exemplu.ro. Apoi.',
      ['Vezi www.exemplu.ro.', 'Apoi.'],
    ],
  ])('does not split at %s', (_, text, expected) => {
    expect(split(text)).toEqual(expected);
  });

  it('splits after an ellipsis even when the word before it is an abbreviation', () => {
    expect(split('Și așa mai departe etc... Apoi tăcu.')).toEqual([
      'Și așa mai departe etc...',
      'Apoi tăcu.',
    ]);
  });

  it('gives the offset of each sentence in the input', () => {
    const text = '  Ion veni.   Ana plecă!\tGata';
    const sentences = segmentSentences(text);
    expect(sentences).toEqual([
      { text: 'Ion veni.', start: 2 },
      { text: 'Ana plecă!', start: 14 },
      { text: 'Gata', start: 25 },
    ]);
    for (const sentence of sentences) {
      expect(text.startsWith(sentence.text, sentence.start)).toBe(true);
    }
  });

  it.each([
    ['empty text', ''],
    ['only whitespace', '   \t '],
  ])('returns nothing for %s', (_, text) => {
    expect(segmentSentences(text)).toEqual([]);
  });

  it('keeps punctuation-only text as one sentence', () => {
    expect(split('...')).toEqual(['...']);
  });

  it('lists every abbreviation in lowercase, without the final period', () => {
    for (const word of ABBREVIATIONS) {
      expect(word).toBe(word.toLowerCase());
      expect(word.endsWith('.')).toBe(false);
    }
  });
});
