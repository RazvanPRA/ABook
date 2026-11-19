import { rangesFromStarts } from '../chapterRanges';
import { chaptersFromOutline, type OutlineItem } from '../chaptersFromOutline';
import { fixedPageChapters } from '../fixedPageChapters';

function item(
  title: string,
  page: number | null,
  ...items: OutlineItem[]
): OutlineItem {
  return { title, page, items };
}

describe('rangesFromStarts', () => {
  it('covers the book with contiguous ranges', () => {
    expect(
      rangesFromStarts(
        [
          { title: 'Capitolul I', page: 1 },
          { title: 'Capitolul II', page: 12 },
          { title: 'Capitolul III', page: 30 },
        ],
        40,
      ),
    ).toEqual([
      { title: 'Capitolul I', startPage: 1, endPage: 11 },
      { title: 'Capitolul II', startPage: 12, endPage: 29 },
      { title: 'Capitolul III', startPage: 30, endPage: 40 },
    ]);
  });

  it('adds an untitled chapter for the pages before the first start', () => {
    expect(rangesFromStarts([{ title: 'I', page: 5 }], 9)).toEqual([
      { title: '', startPage: 1, endPage: 4 },
      { title: 'I', startPage: 5, endPage: 9 },
    ]);
  });

  it('sorts, keeps the first start of a page and ignores pages outside the book', () => {
    expect(
      rangesFromStarts(
        [
          { title: 'Doi', page: 6 },
          { title: 'Unu', page: 1 },
          { title: 'Duplicat', page: 6 },
          { title: 'Zero', page: 0 },
          { title: 'Dincolo', page: 11 },
        ],
        10,
      ),
    ).toEqual([
      { title: 'Unu', startPage: 1, endPage: 5 },
      { title: 'Doi', startPage: 6, endPage: 10 },
    ]);
  });

  it('makes one chapter of the whole book without starts', () => {
    expect(rangesFromStarts([], 7)).toEqual([
      { title: '', startPage: 1, endPage: 7 },
    ]);
  });

  it('returns nothing for a book without pages', () => {
    expect(rangesFromStarts([{ title: 'I', page: 1 }], 0)).toEqual([]);
  });

  it('allows a one-page chapter at the end', () => {
    expect(
      rangesFromStarts(
        [
          { title: 'A', page: 1 },
          { title: 'Epilog', page: 3 },
        ],
        3,
      ),
    ).toEqual([
      { title: 'A', startPage: 1, endPage: 2 },
      { title: 'Epilog', startPage: 3, endPage: 3 },
    ]);
  });
});

describe('chaptersFromOutline', () => {
  it('uses the top-level entries and normalizes their titles', () => {
    const outline = [
      item('  Partea întâi:\n Glasul pământului ', 3, item('I. Începutul', 3)),
      item('Partea a doua: Glasul iubirii', 150),
    ];
    expect(chaptersFromOutline(outline, 300)).toEqual([
      { title: '', startPage: 1, endPage: 2 },
      {
        title: 'Partea întâi: Glasul pământului',
        startPage: 3,
        endPage: 149,
      },
      { title: 'Partea a doua: Glasul iubirii', startPage: 150, endPage: 300 },
    ]);
  });

  it('goes one level down when the top level is a single root', () => {
    const outline = [
      item('Cuprins', 1, item('Capitolul I', 1), item('Capitolul II', 20)),
    ];
    expect(chaptersFromOutline(outline, 30)).toEqual([
      { title: 'Capitolul I', startPage: 1, endPage: 19 },
      { title: 'Capitolul II', startPage: 20, endPage: 30 },
    ]);
  });

  it('skips entries without a page or outside the book', () => {
    const outline = [
      item('Copertă', null),
      item('I', 2),
      item('II', 8),
      item('Anexă', 99),
    ];
    expect(chaptersFromOutline(outline, 10)).toEqual([
      { title: '', startPage: 1, endPage: 1 },
      { title: 'I', startPage: 2, endPage: 7 },
      { title: 'II', startPage: 8, endPage: 10 },
    ]);
  });

  it.each([
    ['an empty outline', []],
    ['a single entry', [item('Ion', 1)]],
    ['entries on the same page', [item('A', 4), item('B', 4)]],
    ['entries without pages', [item('A', null), item('B', null)]],
    [
      'a single root whose children have one page',
      [item('Cuprins', 1, item('I', 2), item('II', null))],
    ],
  ])('returns null for %s', (_, outline) => {
    expect(chaptersFromOutline(outline, 50)).toBeNull();
  });
});

describe('fixedPageChapters', () => {
  it('cuts every 10 pages by default, the last chapter shorter', () => {
    expect(fixedPageChapters(25)).toEqual([
      { title: '', startPage: 1, endPage: 10 },
      { title: '', startPage: 11, endPage: 20 },
      { title: '', startPage: 21, endPage: 25 },
    ]);
  });

  it.each([
    [10, 1],
    [11, 2],
    [1, 1],
    [412, 42],
  ])('%p pages → %p chapters', (pages, chapters) => {
    expect(fixedPageChapters(pages)).toHaveLength(chapters);
  });

  it('accepts another size and guards against nonsense sizes', () => {
    expect(fixedPageChapters(6, 3)).toHaveLength(2);
    expect(fixedPageChapters(3, 0)).toHaveLength(3);
    expect(fixedPageChapters(5, 2.7)).toHaveLength(3);
  });

  it('returns nothing for a book without pages', () => {
    expect(fixedPageChapters(0)).toEqual([]);
    expect(fixedPageChapters(-3)).toEqual([]);
  });
});
