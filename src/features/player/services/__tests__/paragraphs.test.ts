import { toPageNumber } from '@/shared/domain';
import { groupParagraphs, paragraphOf, PARAGRAPH_LENGTH } from '../paragraphs';

const chunk = (...sentences: [text: string, page: number][]) => ({
  sentences: sentences.map(([text]) => text),
  sentencePages: sentences.map(([, page]) => toPageNumber(page)),
});
const long = 'x'.repeat(PARAGRAPH_LENGTH);

it.each([
  ['nothing', chunk(), []],
  ['one sentence', chunk(['A.', 1]), [[0, 1]]],
  ['same page', chunk(['A.', 1], ['B.', 1]), [[0, 2]]],
  [
    'a page change',
    chunk(['A.', 1], ['B.', 2], ['C.', 2]),
    [
      [0, 1],
      [1, 3],
    ],
  ],
  [
    'dialogue',
    chunk(['Zise:', 1], ['— Vino!', 1], ['– Da.', 1]),
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  ],
  [
    'a long one, not split',
    chunk([long + long, 1], ['B.', 1]),
    [
      [0, 1],
      [1, 2],
    ],
  ],
  [
    'enough text',
    chunk(['A.', 1], [long, 1], ['B.', 1]),
    [
      [0, 2],
      [2, 3],
    ],
  ],
])('%s', (_name, given, expected) => {
  expect(groupParagraphs(given).map(({ first, end }) => [first, end])).toEqual(
    expected,
  );
});

it('finds the paragraph of a sentence', () => {
  const paragraphs = groupParagraphs(chunk(['A.', 1], ['B.', 2], ['C.', 2]));
  expect([0, 1, 2, 3].map(i => paragraphOf(paragraphs, i))).toEqual([
    0, 1, 1, -1,
  ]);
});
