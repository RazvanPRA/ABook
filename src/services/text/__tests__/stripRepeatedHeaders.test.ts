import {
  BOOK_HEADER,
  bookPage,
  line,
  page,
  texts,
} from '../__fixtures__/pages';
import {
  HEADER_SAMPLE_PAGES,
  detectRepeatedHeaders,
} from '../detectRepeatedHeaders';
import { headerSignature } from '../pageBands';
import { stripRepeatedHeaders } from '../stripRepeatedHeaders';
import type { PageText } from '../types';

const BODY = 'Drumul pornește din șoseaua cea mare a Clujului.';

/** Pages with alternating running headers, as printed books have: book title / chapter title. */
function alternatingPages(count: number): PageText[] {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    const header = number % 2 === 0 ? 'ION' : 'Glasul pământului';
    return page(
      number,
      line(header, 0.04),
      line(BODY),
      line(`- ${number} -`, 0.96),
    );
  });
}

describe('detectRepeatedHeaders', () => {
  it('finds the running header and the page-number footer of a printed book', () => {
    const sample = Array.from({ length: 6 }, (_, i) => bookPage(i + 1, BODY));
    expect(detectRepeatedHeaders(sample)).toEqual(
      new Set([headerSignature(BOOK_HEADER), '#']),
    );
  });

  it('keeps alternating headers that each appear on exactly half of the pages', () => {
    expect(detectRepeatedHeaders(alternatingPages(10))).toEqual(
      new Set(['ion', 'glasul pământului', '- # -']),
    );
  });

  it('ignores a line that repeats in the middle of the page', () => {
    const sample = [1, 2, 3, 4].map(n => page(n, line('Refren: Hai, hai!')));
    expect(detectRepeatedHeaders(sample).size).toBe(0);
  });

  it('ignores a band line below the 50% threshold', () => {
    const sample = [1, 2, 3, 4, 5].map(n =>
      page(n, line(n <= 2 ? 'Prefață' : `Rând ${'x'.repeat(n)}`, 0.04)),
    );
    expect(detectRepeatedHeaders(sample).size).toBe(0);
  });

  it('counts a header once per page, even if it appears twice on the same page', () => {
    const sample = [
      page(1, line('ION', 0.04), line('ION', 0.96)),
      page(2, line(BODY, 0.04)),
      page(3, line('Altceva', 0.04)),
    ];
    expect(detectRepeatedHeaders(sample).size).toBe(0);
  });

  it.each([
    ['no pages', []],
    ['a single page', [bookPage(1, BODY)]],
    ['only empty pages', [page(1), page(2), page(3)]],
  ])('finds nothing with %s', (_, sample: PageText[]) => {
    expect(detectRepeatedHeaders(sample).size).toBe(0);
  });

  it('needs at least 2 pages, so a 2-page sample needs the line on both', () => {
    const once = [page(1, line('ION', 0.04)), page(2, line(BODY))];
    const twice = [page(1, line('ION', 0.04)), page(2, line('ION', 0.04))];
    expect(detectRepeatedHeaders(once).size).toBe(0);
    expect(detectRepeatedHeaders(twice)).toEqual(new Set(['ion']));
  });

  it('skips empty pages when computing the share, and blank band lines', () => {
    const sample = [
      bookPage(1, BODY),
      page(2),
      page(3),
      bookPage(4, BODY),
      page(5, line('   ', 0.04), line(BODY)),
    ];
    expect(detectRepeatedHeaders(sample)).toEqual(
      new Set([headerSignature(BOOK_HEADER), '#']),
    );
  });

  it('samples 20 pages by default', () => {
    expect(HEADER_SAMPLE_PAGES).toBe(20);
  });
});

describe('stripRepeatedHeaders', () => {
  it('removes the header and footer from every page, inside and outside the sample', () => {
    const book = Array.from({ length: 30 }, (_, i) => bookPage(i + 1, BODY));
    const headers = detectRepeatedHeaders(book.slice(0, HEADER_SAMPLE_PAGES));
    const stripped = stripRepeatedHeaders(book, headers);
    expect(texts(stripped)).toEqual(book.map(() => [BODY]));
    expect(stripped.map(entry => entry.page)).toEqual(book.map(e => e.page));
  });

  it('keeps the same words when they appear in the body of the page', () => {
    const headers = new Set([headerSignature(BOOK_HEADER)]);
    const pages = [page(7, line(BOOK_HEADER, 0.04), line(BOOK_HEADER, 0.5))];
    expect(texts(stripRepeatedHeaders(pages, headers))).toEqual([
      [BOOK_HEADER],
    ]);
  });

  it('keeps everything when no headers were found, and handles empty input', () => {
    const pages = [bookPage(1, BODY)];
    expect(stripRepeatedHeaders(pages, new Set())).toEqual(pages);
    expect(stripRepeatedHeaders([], new Set(['ion']))).toEqual([]);
  });

  it('does not mutate its input', () => {
    const pages = [bookPage(1, BODY)];
    const copy = JSON.parse(JSON.stringify(pages));
    stripRepeatedHeaders(pages, new Set([headerSignature(BOOK_HEADER)]));
    expect(pages).toEqual(copy);
  });
});
