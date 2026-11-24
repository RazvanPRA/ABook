import { EXCERPT_LENGTH, makeExcerpt } from '../makeExcerpt';

it.each([
  ['  Scurtă. ', 'Scurtă.'],
  ['', ''],
  ['x'.repeat(EXCERPT_LENGTH), 'x'.repeat(EXCERPT_LENGTH)],
  ['x'.repeat(200), `${'x'.repeat(EXCERPT_LENGTH)}…`],
  [`${'x'.repeat(115)} ${'y'.repeat(20)}`, `${'x'.repeat(115)}…`],
])('%s', (sentence, expected) => {
  expect(makeExcerpt(sentence)).toBe(expected);
});
