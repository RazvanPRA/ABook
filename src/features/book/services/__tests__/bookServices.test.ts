import { toChapterIndex, type Progress } from '@/shared/domain';
import { makeProgress } from '@/shared/domain/__fixtures__/progress';
import { chapterTitle } from '../chapterTitle';
import { deriveChapterStatus } from '../deriveChapterStatus';
import { formatBookMeta, type BookMetaWords } from '../formatBookMeta';

const at = (chapter: number, finished = false): Progress =>
  makeProgress({ chapter: toChapterIndex(chapter), finished });

describe('deriveChapterStatus', () => {
  it.each([
    ['never played', null, ['pending', 'pending', 'pending']],
    ['at the start', at(0), ['current', 'pending', 'pending']],
    ['in the middle', at(1), ['done', 'current', 'pending']],
    ['in the last chapter', at(2), ['done', 'done', 'current']],
    ['finished', at(2, true), ['done', 'done', 'done']],
    ['past the saved chapters', at(5), ['done', 'done', 'done']],
  ])('%s', (_case, progress, expected) => {
    const statuses = [0, 1, 2].map(index =>
      deriveChapterStatus({ index: toChapterIndex(index) }, progress),
    );
    expect(statuses).toEqual(expected);
  });
});

describe('chapterTitle', () => {
  it.each([
    ['Partea I', 0, 'Partea I'],
    ['  Partea I ', 0, 'Partea I'],
    ['', 2, 'Capitolul 3'],
    ['   ', 0, 'Capitolul 1'],
  ])('"%s" → %s', (title, index, expected) => {
    expect(
      chapterTitle(
        { title, index: toChapterIndex(index) },
        n => `Capitolul ${n}`,
      ),
    ).toBe(expected);
  });
});

describe('formatBookMeta', () => {
  const words: BookMetaWords = {
    pages: count => `${count} p`,
    bytes: { B: 'B', KB: 'KB', MB: 'MB', GB: 'GB' },
    language: 'Engleză',
    offline: 'Offline',
  };
  const book = {
    pageCount: 82,
    fileSizeBytes: 1_258_291,
  } as const;

  it('lists pages, size, language and offline', () => {
    expect(formatBookMeta(book, words)).toEqual([
      '82 p',
      '1,2 MB',
      'Engleză',
      'Offline',
    ]);
  });

  it('leaves out the pages until they are known', () => {
    expect(formatBookMeta({ ...book, pageCount: 0 }, words)).toHaveLength(3);
  });
});
