import { toBookId, toChapterIndex } from '@/shared/domain';
import {
  assertNamespaced,
  bookIdFromKey,
  bookKey,
  bookPrefix,
  chapterKey,
  chapterPartsPrefix,
  isMetaKey,
  isNamespaced,
  rootKey,
} from '../keys';

const ID = toBookId('0b6f2f4e-7c1a-4d8e-9f3a-2a5b6c7d8e9f');
const CH1 = toChapterIndex(1);

describe('key builders', () => {
  it('builds the keys from the storage key table', () => {
    expect(rootKey('books')).toBe('abk:books');
    expect(rootKey('settings')).toBe('abk:settings');
    expect(rootKey('schemaVersion')).toBe('abk:schemaVersion');
    expect(bookKey(ID, 'meta')).toBe(`abk:book:${ID}:meta`);
    expect(bookKey(ID, 'toc')).toBe(`abk:book:${ID}:toc`);
    expect(bookKey(ID, 'progress')).toBe(`abk:book:${ID}:progress`);
    expect(bookKey(ID, 'bookmarks')).toBe(`abk:book:${ID}:bookmarks`);
    expect(chapterKey(ID, CH1)).toBe(`abk:book:${ID}:ch:1`);
    expect(chapterKey(ID, CH1, 0)).toBe(`abk:book:${ID}:ch:1:p:0`);
  });

  it('puts every book key under the book prefix', () => {
    const keys = [bookKey(ID, 'meta'), chapterKey(ID, CH1, 3)];
    expect(keys.every(key => key.startsWith(bookPrefix(ID)))).toBe(true);
  });

  it('keeps chapter 1 parts apart from chapter 10 parts', () => {
    const ch10 = chapterKey(ID, toChapterIndex(10), 0);
    expect(ch10.startsWith(chapterPartsPrefix(ID, CH1))).toBe(false);
    expect(chapterKey(ID, CH1, 0).startsWith(chapterPartsPrefix(ID, CH1))).toBe(
      true,
    );
  });
});

describe('key parsers', () => {
  it.each([
    [bookKey(ID, 'meta'), ID],
    [chapterKey(ID, CH1, 2), ID],
    [rootKey('books'), null],
    ['abk:book:not-a-uuid:meta', null],
    [`abk:book:${ID}`, null],
    [`other:book:${ID}:meta`, null],
  ])('bookIdFromKey(%p) = %p', (key, expected) => {
    expect(bookIdFromKey(key)).toBe(expected);
  });

  it.each([
    [bookKey(ID, 'meta'), true],
    [bookKey(ID, 'toc'), false],
    [`${bookKey(ID, 'meta')}:x`, false],
    [rootKey('settings'), false],
  ])('isMetaKey(%p) = %p', (key, expected) => {
    expect(isMetaKey(key)).toBe(expected);
  });

  it('recognizes the namespace', () => {
    expect(isNamespaced(rootKey('books'))).toBe(true);
    expect(isNamespaced('books')).toBe(false);
    expect(() => assertNamespaced([rootKey('books')])).not.toThrow();
    expect(() => assertNamespaced([rootKey('books'), 'x'])).toThrow(/x/);
  });
});
