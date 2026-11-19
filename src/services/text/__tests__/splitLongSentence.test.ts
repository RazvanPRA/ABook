import { MAX_SENTENCE_CHARS, splitLongSentence } from '../splitLongSentence';

/** Romanian filler of exactly `length` characters, words separated by spaces, no punctuation. */
function words(length: number): string {
  return 'pământ '
    .repeat(Math.ceil(length / 7))
    .slice(0, length)
    .trimEnd()
    .padEnd(length, 'a');
}

describe('splitLongSentence', () => {
  it.each([
    ['a short sentence', 'Ion iubea pământul.'],
    ['exactly the limit', words(MAX_SENTENCE_CHARS)],
  ])('returns %s unchanged', (_, sentence) => {
    expect(splitLongSentence(sentence)).toEqual([sentence]);
  });

  it('splits one character over the limit', () => {
    const parts = splitLongSentence(words(MAX_SENTENCE_CHARS + 1));
    expect(parts.length).toBe(2);
    parts.forEach(part => expect(part.length).toBeLessThanOrEqual(400));
  });

  it('cuts after the comma closest to the middle and keeps the comma', () => {
    const sentence = 'Ana a venit, Ion a plecat, Maria a tăcut, toți au plâns.';
    expect(splitLongSentence(sentence, 30)).toEqual([
      'Ana a venit, Ion a plecat,',
      'Maria a tăcut, toți au plâns.',
    ]);
  });

  it('treats the semicolon like the comma', () => {
    expect(
      splitLongSentence('Era iarnă; satul dormea sub zăpadă.', 25),
    ).toEqual(['Era iarnă;', 'satul dormea sub zăpadă.']);
  });

  it('prefers punctuation to a space nearer the middle', () => {
    // 43 characters: the only comma is near the start, a space would be nearer the middle
    expect(
      splitLongSentence('Ion, care venise de departe cu căruța plină', 40),
    ).toEqual(['Ion,', 'care venise de departe cu căruța plină']);
  });

  it('does not cut at a decimal comma', () => {
    expect(splitLongSentence('Costa 3,5 lei și era foarte scump', 20)).toEqual([
      'Costa 3,5 lei și',
      'era foarte scump',
    ]);
  });

  it('cuts at the space closest to the middle when there is no punctuation', () => {
    expect(splitLongSentence('unu doi trei patru cinci șase', 20)).toEqual([
      'unu doi trei',
      'patru cinci șase',
    ]);
  });

  it('cuts a run without spaces at the limit, as a last resort', () => {
    const url = 'h'.repeat(950);
    expect(splitLongSentence(url)).toEqual([
      'h'.repeat(400),
      'h'.repeat(400),
      'h'.repeat(150),
    ]);
  });

  it('splits recursively until every part fits, without losing text', () => {
    const sentence = Array.from(
      { length: 40 },
      (_, i) => `Ion merse la târg a ${i + 1}-a oară, cumpără ceva`,
    ).join('; ');
    const parts = splitLongSentence(sentence);
    expect(sentence.length).toBeGreaterThan(3 * MAX_SENTENCE_CHARS);
    parts.forEach(part => {
      expect(part.length).toBeLessThanOrEqual(MAX_SENTENCE_CHARS);
      expect(part).toBe(part.trim());
      expect(part).not.toBe('');
    });
    expect(parts.join(' ').replace(/\s+/g, ' ')).toBe(sentence);
  });

  it('never cuts inside a word when there are spaces', () => {
    const sentence = words(1000);
    const vocabulary = new Set(sentence.split(' '));
    for (const part of splitLongSentence(sentence)) {
      part.split(' ').forEach(word => expect(vocabulary.has(word)).toBe(true));
    }
  });

  it('trims, and returns nothing for blank text', () => {
    expect(splitLongSentence('  Gata.  ')).toEqual(['Gata.']);
    expect(splitLongSentence('   ')).toEqual([]);
    expect(splitLongSentence('')).toEqual([]);
  });
});
