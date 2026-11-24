import { line, page, texts } from '../__fixtures__/pages';
import {
  detectChapterHeaders,
  headerSlots,
  stripChapterRunningHeaders,
} from '../stripChapterRunningHeaders';
import type { PageText } from '../types';

/**
 * A chapter whose odd pages carry the chapter title and even pages the current section title (each
 * section a page or two long), with the page number as a separate footer.
 */
function chapter(count: number): PageText[] {
  return Array.from({ length: count }, (_, index) => {
    const number = 41 + index;
    const head =
      number % 2 === 1
        ? 'CHAPTER 1 PROFES SIONALISM'
        : `SECTION ${String.fromCharCode(65 + index)}`;
    return page(
      number,
      line(head, 0.075),
      line(`Text ${number}.`),
      line(String(number - 33), 0.955, 9),
    );
  });
}

describe('detectChapterHeaders', () => {
  it('finds band lines repeated on at least 3 pages of the chapter, digits aside', () => {
    expect([...detectChapterHeaders(chapter(10))].sort()).toEqual([
      '#', // the page-number footer
      'chapter # profes sionalism',
    ]);
  });

  it('ignores lines on fewer than 3 pages and body lines', () => {
    const pages = [1, 2, 3].map(n =>
      page(
        n,
        line('Same body line'),
        line(n < 3 ? 'Rare head' : 'Other', 0.05),
      ),
    );
    expect(detectChapterHeaders(pages).size).toBe(0);
  });
});

describe('headerSlots', () => {
  it('keeps the slots where 3 or more pages lost a line', () => {
    const before = [1, 2, 3, 4].map(n =>
      page(n, line('head', 0.05), line('foot', 0.96, 9), line('body')),
    );
    const after = before.map((entry, index) => ({
      page: entry.page,
      // the head goes on every page, the footer on two only
      lines: entry.lines.filter(
        item => item.text === 'body' || (item.text === 'foot' && index > 1),
      ),
    }));
    expect([...headerSlots(before, after)]).toEqual(['13:20']);
  });

  it('finds nothing when nothing was removed', () => {
    const pages = [page(1, line('a', 0.05))];
    expect(headerSlots(pages, pages).size).toBe(0);
    expect(headerSlots(pages, []).size).toBe(0); // one page lost a line: below 3
  });
});

describe('stripChapterRunningHeaders', () => {
  it('removes repeated, numbered and same-slot running heads, keeping the body', () => {
    const pages = chapter(10);
    pages.push(
      page(51, line('18Escaping monolithic hell', 0.05), line('Text 51.')),
    );
    const result = texts(stripChapterRunningHeaders(pages));
    expect(result.slice(0, 10)).toEqual(
      Array.from({ length: 10 }, (_, index) => [`Text ${41 + index}.`]),
    );
    expect(result[10]).toEqual(['Text 51.']);
  });

  it('keeps a band line in another slot, such as a heading taller than the running heads', () => {
    const pages = chapter(6);
    const [first] = pages;
    if (!first) {
      throw new Error('no page');
    }
    pages[0] = page(41, ...first.lines, line('Capitolul 1', 0.075, 18));
    expect(texts(stripChapterRunningHeaders(pages))[0]).toEqual([
      'Text 41.',
      'Capitolul 1',
    ]);
  });

  it('leaves a chapter without running heads unchanged', () => {
    const pages = [1, 2].map(n =>
      page(n, line(`Top ${n}`, 0.05), line('Body')),
    );
    expect(stripChapterRunningHeaders(pages)).toEqual(pages);
  });
});
