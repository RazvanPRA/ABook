import { BODY_HEIGHT, line, page } from '../__fixtures__/pages';
import { findChapterHeading, isHeadingLine } from '../findChapterHeading';
import { medianLineHeight } from '../medianLineHeight';

const TALL = BODY_HEIGHT * 1.6;

describe('isHeadingLine', () => {
  it.each([
    ['Capitolul I'],
    ['CAPITOLUL 3'],
    ['capitolul întâi'],
    ['Partea a doua'],
    ['PARTEA ÎNTÂI'],
    ['Cartea I'],
    ['IV'],
    ['XII.'],
    ['  II  '],
  ])('accepts %p when it is taller than the body', text => {
    expect(isHeadingLine(line(text, 0.2, TALL), BODY_HEIGHT)).toBe(true);
  });

  it.each([
    ['body height', 'Capitolul I', BODY_HEIGHT],
    ['barely taller', 'Capitolul I', BODY_HEIGHT * 1.1],
    [
      'a sentence',
      'Capitolul acesta l-a scris în tinerețe, când era student la Viena.',
      TALL,
    ],
    ['another word', 'Glasul pământului', TALL],
    ['a lowercase Roman numeral', 'vi', TALL],
    ['a Roman numeral with text', 'IV oameni', TALL],
    ['a word starting like a heading', 'Partealui', TALL],
    ['blank', '   ', TALL],
  ])('rejects %s', (_, text, height) => {
    expect(isHeadingLine(line(text, 0.2, height), BODY_HEIGHT)).toBe(false);
  });
});

describe('findChapterHeading', () => {
  it('returns the heading of the page', () => {
    const sample = page(
      14,
      line('Capitolul II', 0.2, TALL),
      line('Ion se trezi devreme.'),
    );
    expect(findChapterHeading(sample, BODY_HEIGHT)).toBe('Capitolul II');
  });

  it('adds the tall line under the heading to the title', () => {
    const sample = page(
      3,
      line('I', 0.15, TALL),
      line('Glasul  pământului', 0.2, TALL),
      line('Drumul pornește din șoseaua cea mare.'),
    );
    expect(findChapterHeading(sample, BODY_HEIGHT)).toBe(
      'I — Glasul pământului',
    );
  });

  it('does not add a body line or a long tall line', () => {
    const body = page(1, line('Capitolul I', 0.2, TALL), line('Era vară.'));
    const long = page(
      1,
      line('Capitolul I', 0.2, TALL),
      line('x'.repeat(61), 0.25, TALL),
    );
    expect(findChapterHeading(body, BODY_HEIGHT)).toBe('Capitolul I');
    expect(findChapterHeading(long, BODY_HEIGHT)).toBe('Capitolul I');
  });

  it('finds a heading that is the last line of the page', () => {
    const sample = page(9, line('Text.'), line('Partea a doua', 0.85, TALL));
    expect(findChapterHeading(sample, BODY_HEIGHT)).toBe('Partea a doua');
  });

  it('returns null for a page without a heading, or empty', () => {
    expect(
      findChapterHeading(page(1, line('Capitolul I')), BODY_HEIGHT),
    ).toBeNull();
    expect(findChapterHeading(page(2), BODY_HEIGHT)).toBeNull();
  });
});

describe('medianLineHeight', () => {
  it.each([
    ['odd count', [10, 30, 10], 10],
    ['even count', [10, 12, 30, 10], 11],
    ['a single line', [14], 14],
  ])('%s', (_, heights, expected) => {
    const pages = [page(1, ...heights.map(h => line('text', 0.5, h)))];
    expect(medianLineHeight(pages)).toBe(expected);
  });

  it('ignores blank lines and works across pages', () => {
    const pages = [
      page(1, line('a', 0.5, 10), line('  ', 0.5, 99)),
      page(2, line('b', 0.5, 12), line('c', 0.5, 12)),
    ];
    expect(medianLineHeight(pages)).toBe(12);
  });

  it('is 0 without lines', () => {
    expect(medianLineHeight([])).toBe(0);
    expect(medianLineHeight([page(1)])).toBe(0);
  });
});
