import { line, page, texts } from '../__fixtures__/pages';
import { stripPageNumbers } from '../stripPageNumbers';

const BODY = 'Herdelea se uită lung după ei.';
const TOP = 0.04;
const BOTTOM = 0.96;

function strip(text: string, y: number): string[] {
  const [lines = []] = texts(
    stripPageNumbers([page(1, line(BODY), line(text, y))]),
  );
  return lines;
}

describe('stripPageNumbers', () => {
  it.each([
    ['12'],
    ['1024'],
    ['  7  '],
    ['- 12 -'],
    ['–12–'],
    ['— 12 —'],
    ['12 / 300'],
    ['12/300'],
    ['12 din 300'],
    ['Pagina 12'],
    ['pag. 12'],
    ['p. 12'],
  ])('removes %p in the footer and in the header', text => {
    expect(strip(text, BOTTOM)).toEqual([BODY]);
    expect(strip(text, TOP)).toEqual([BODY]);
  });

  it.each([['iv'], ['XII'], ['xlviii']])(
    'removes the Roman numeral %p in the footer only',
    text => {
      expect(strip(text, BOTTOM)).toEqual([BODY]);
      expect(strip(text, TOP)).toEqual([BODY, text]);
    },
  );

  it.each([
    ['a number alone in the body of the page', '1907', 0.5],
    ['a Roman chapter heading at the top', 'IV', TOP],
    ['a chapter title with a number', 'Capitolul 3', TOP],
    ['a year inside a sentence', 'În 1907 a izbucnit răscoala.', BOTTOM],
    ['a number with more than 4 digits', '12345', BOTTOM],
    ['a list item', '3.', BOTTOM],
    ['an empty footer line', '', BOTTOM],
  ])('keeps %s', (_, text, y) => {
    expect(strip(text, y)).toEqual([BODY, text]);
  });

  it('works page by page and keeps the page numbers of the pages', () => {
    const pages = [
      page(9, line(BODY), line('9', BOTTOM)),
      page(10),
      page(11, line('— 11 —', TOP), line(BODY)),
    ];
    const stripped = stripPageNumbers(pages);
    expect(texts(stripped)).toEqual([[BODY], [], [BODY]]);
    expect(stripped.map(entry => entry.page)).toEqual([9, 10, 11]);
  });

  it('handles empty input and does not mutate its input', () => {
    expect(stripPageNumbers([])).toEqual([]);
    const pages = [page(1, line('5', BOTTOM))];
    stripPageNumbers(pages);
    expect(pages[0]?.lines).toHaveLength(1);
  });
});
