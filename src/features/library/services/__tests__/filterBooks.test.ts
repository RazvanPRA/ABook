import type { BookId, BookMeta, Progress } from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';
import { makeProgress } from '@/shared/domain/__fixtures__/progress';
import { filterBooks } from '../filterBooks';
import { foldText } from '../foldText';

const [A, B, C] = BOOK_IDS as [BookId, BookId, BookId];

const code = (value: number) => String.fromCharCode(value);

describe('foldText', () => {
  it.each([
    ['ĂÂÎȘȚ ăâîșț', 'aaist aaist'],
    [`${code(0x15e)}tefan ${code(0x163)}ara`, 'stefan tara'], // cedilla
    [`s${code(0x326)}i a${code(0x306)}`, 'si a'], // decomposed
    [`o${code(0x301)}`, 'o'], // a combining mark Romanian doesn't use
    ['Émile Zola, Ödön', 'emile zola, odon'],
    ['', ''],
  ])('%s → %s', (text, expected) => {
    expect(foldText(text)).toBe(expected);
  });
});

const item = (
  id: BookId,
  meta: Partial<BookMeta>,
  progress: Progress | null = null,
) => ({
  book: makeMeta(id, { status: 'ready', ...meta }),
  progress,
});

const items = [
  item(A, { title: 'Amintiri din copilărie', author: 'Ion Creangă' }),
  item(
    B,
    { title: 'Țara de dincolo de negură', author: 'Mihail Sadoveanu' },
    makeProgress(),
  ),
  item(
    C,
    { title: 'Baltagul', author: 'Mihail Sadoveanu' },
    makeProgress({ finished: true }),
  ),
];
const ids = (query: string, filter: 'all' | 'reading' | 'finished' = 'all') =>
  filterBooks(items, { query, filter }).map(i => i.book.id);

describe('filterBooks', () => {
  it.each([
    ['an empty query', '', [A, B, C]],
    ['only spaces', '   ', [A, B, C]],
    ['the author', 'sadoveanu', [B, C]],
    ['the title, upper case', 'AMINTIRI', [A]],
    ['no diacritics', 'copilarie creanga', [A]],
    ['comma below', 'țara', [B]],
    ['cedilla', `${code(0x163)}ara`, [B]],
    ['words across title and author, any order', 'mihail baltagul', [C]],
    ['part of a word', 'balt', [C]],
    ['nothing', 'rebreanu', []],
  ])('matches %s', (_case, query, expected) => {
    expect(ids(query)).toEqual(expected);
  });

  it.each([
    ['all', [A, B, C]],
    ['reading', [B]],
    ['finished', [C]],
  ] as const)('filters %s', (filter, expected) => {
    expect(ids('', filter)).toEqual(expected);
  });

  it('combines the query and the filter', () => {
    expect(ids('sadoveanu', 'finished')).toEqual([C]);
    expect(ids('amintiri', 'finished')).toEqual([]);
  });

  it('counts a book being imported, or failed after being started, as "în curs"', () => {
    const others = [
      item(A, { status: 'processing' }),
      item(B, { status: 'failed' }, makeProgress()),
      item(C, { status: 'failed' }),
    ];
    const found = filterBooks(others, { query: '', filter: 'reading' });
    expect(found.map(i => i.book.id)).toEqual([A, B]);
  });
});
