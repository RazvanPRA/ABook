import { toPageNumber, type BookId, type BookMeta } from '@/shared/domain';
import type { Progress } from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';
import { makeProgress } from '@/shared/domain/__fixtures__/progress';
import { bookListStatus } from '../bookListStatus';
import { listenedPercent } from '../listenedPercent';
import { pickContinueListening } from '../pickContinueListening';
import { sortByLastPlayed } from '../sortByLastPlayed';

const [A, B, C] = BOOK_IDS as [BookId, BookId, BookId];
const ready = (id: BookId) =>
  makeMeta(id, { status: 'ready', processedPages: 120 });
const item = (book: BookMeta, progress: Progress | null = null) => ({
  book,
  progress,
});
const at = (day: number, overrides: Partial<Progress> = {}) =>
  makeProgress({ updatedAt: `2026-11-0${day}T10:00:00.000Z`, ...overrides });

describe('listenedPercent', () => {
  const page = (value: number, finished = false) =>
    makeProgress({ page: toPageNumber(value), finished });

  it.each([
    ['never played', 82, null, 0],
    ['page 34 of 82, as in the mockup', 82, page(34), 41],
    ['the last page', 82, page(82), 100],
    ['past the last page', 82, page(90), 100],
    ['an unknown page count', 0, page(3), 0],
    ['finished on an early page', 82, page(1, true), 100],
    ['finished with an unknown page count', 0, page(1, true), 100],
  ])('%s', (_case, pageCount, progress, expected) => {
    expect(listenedPercent({ pageCount }, progress)).toBe(expected);
  });
});

describe('bookListStatus', () => {
  it.each([
    ['unstarted', item(ready(A))],
    ['reading', item(ready(A), at(1))],
    ['finished', item(ready(A), at(1, { finished: true }))],
    ['processing', item(makeMeta(A), at(1))],
    ['failed', item(makeMeta(A, { status: 'failed' }), at(1))],
  ] as const)('%s', (expected, input) => {
    expect(bookListStatus(input)).toBe(expected);
  });
});

describe('sortByLastPlayed', () => {
  it('puts the last played first, then the never played in library order', () => {
    const items = [
      item(ready(A)),
      item(ready(B), at(1)),
      item(ready(C), at(2)),
    ];
    expect(sortByLastPlayed(items).map(i => i.book.id)).toEqual([C, B, A]);
  });

  it('keeps the library order on ties and does not change its input', () => {
    const items = [A, B, C].map(id => item(ready(id), at(1)));
    const before = [...items];
    expect(sortByLastPlayed(items)).toEqual(before);
    const unplayed = [item(ready(B)), item(ready(A))];
    expect(sortByLastPlayed(unplayed)).toEqual(unplayed);
    expect(items).toEqual(before);
  });
});

describe('pickContinueListening', () => {
  it('picks the first started, unfinished book', () => {
    const items = [
      item(ready(A), at(3, { finished: true })),
      item(ready(B), at(2)),
      item(ready(C), at(1)),
    ];
    expect(pickContinueListening(items)?.book.id).toBe(B);
  });

  it('accepts a book still being imported', () => {
    expect(pickContinueListening([item(makeMeta(A), at(1))])?.book.id).toBe(A);
  });

  it('is null with nothing started', () => {
    expect(pickContinueListening([item(ready(A))])).toBeNull();
    expect(pickContinueListening([])).toBeNull();
  });
});
