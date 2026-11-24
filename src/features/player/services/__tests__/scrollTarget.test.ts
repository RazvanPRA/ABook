import { isInTopThird, sentenceTop } from '../scrollTarget';

const SENTENCES = ['xx', 'a'.repeat(10), 'b'.repeat(30), 'yy'];
const layout = { y: 100, height: 200 };
const paragraph = { first: 1, end: 3 };

it.each([
  [1, 100],
  [2, 150],
])('sentence %d of a paragraph is at %d', (sentence, top) => {
  expect(sentenceTop(SENTENCES, { paragraph, sentence, layout })).toBe(top);
});

it('a paragraph without characters is at its top', () => {
  expect(
    sentenceTop([''], { paragraph: { first: 0, end: 1 }, sentence: 0, layout }),
  ).toBe(100);
});

it.each([
  [-1, false],
  [0, true],
  [100, true],
  [101, false],
])('%d of 300 in the top third: %s', (top, expected) => {
  expect(isInTopThird(top, 300)).toBe(expected);
});
