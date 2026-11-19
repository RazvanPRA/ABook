import { line, page, texts } from '../__fixtures__/pages';
import {
  printedPageOffset,
  stripNumberedRunningHeaders,
} from '../stripNumberedRunningHeaders';
import type { PageText } from '../types';

const SECTIONS = [
  'Overview of messaging',
  'Using asynchronous messaging',
  'Handling failures',
];

/**
 * A chapter laid out like a printed technical book: PDF page = printed page + 30, the printed
 * number glued to the running head (`72 CHAPTER 3 …` on even pages, `71Overview…` on odd ones).
 */
function chapterPages(first: number, count: number): PageText[] {
  return Array.from({ length: count }, (_, index) => {
    const number = first + index;
    const printed = number - 30;
    const head =
      printed % 2 === 0
        ? `${printed} CHAPTER 3 Interprocess communication`
        : `${printed}${SECTIONS[index % SECTIONS.length]}`;
    return page(number, line(head, 0.05), line(`Body of page ${printed}.`));
  });
}

describe('printedPageOffset', () => {
  it('finds the offset most pages agree on', () => {
    expect(printedPageOffset(chapterPages(101, 6))).toBe(30);
  });

  it('reads trailing numbers too, and counts a page once', () => {
    const pages = [4, 5, 6].map(n =>
      page(
        n,
        line(`Ion — pagina ${n - 2}`, 0.96),
        line(`${n - 2} Ion ${n - 2}`, 0.04),
      ),
    );
    expect(printedPageOffset(pages)).toBe(2);
  });

  it('needs at least 3 pages to agree', () => {
    expect(printedPageOffset(chapterPages(101, 2))).toBeNull();
    expect(printedPageOffset([page(1, line('Ion', 0.04))])).toBeNull();
    expect(printedPageOffset([])).toBeNull();
  });

  it('ignores numbers in the body', () => {
    const pages = [1, 2, 3].map(n => page(n, line(`${n} mere`, 0.5)));
    expect(printedPageOffset(pages)).toBeNull();
  });

  it('keeps the first offset found when two are as common', () => {
    const pages = [10, 11, 12].map(n =>
      page(n, line(`${n - 1} A`, 0.04), line(`${n - 5} B`, 0.96)),
    );
    expect(printedPageOffset(pages)).toBe(1);
  });
});

describe('stripNumberedRunningHeaders', () => {
  it('removes the running heads that carry the printed page number, whatever their text', () => {
    expect(texts(stripNumberedRunningHeaders(chapterPages(101, 4)))).toEqual([
      ['Body of page 71.'],
      ['Body of page 72.'],
      ['Body of page 73.'],
      ['Body of page 74.'],
    ]);
  });

  it('keeps band lines whose number is not the printed page number', () => {
    const pages = chapterPages(101, 4);
    const first = pages[0];
    if (!first) {
      throw new Error('no page');
    }
    pages[0] = page(
      101,
      ...first.lines,
      line('3 services talk', 0.08),
      line('71 mere', 0.5),
    );
    expect(texts(stripNumberedRunningHeaders(pages))[0]).toEqual([
      'Body of page 71.',
      '3 services talk',
      '71 mere',
    ]);
  });

  it('leaves the pages unchanged when no numbering is found', () => {
    const pages = chapterPages(101, 2);
    expect(stripNumberedRunningHeaders(pages)).toEqual(pages);
  });
});
