import { toChapterIndex, type BookId } from '@/shared/domain';
import { bookKey, bookPrefix } from '@/storage';
import {
  BOOK_IDS,
  SOURCE_URI,
  makeChunk,
  makeMeta,
  setupRepository,
} from '../../__fixtures__/books';

const [ID, OTHER] = BOOK_IDS as [BookId, BookId];

/** Two complete books, plus progress and bookmark keys written by other repositories. */
const twoBooks = async () => {
  const setup = setupRepository();
  for (const id of [ID, OTHER]) {
    await setup.repo.storePdf(id, SOURCE_URI);
    await setup.repo.createBook(makeMeta(id));
    await setup.repo.saveChapter(id, toChapterIndex(0), makeChunk(5000));
    await setup.kv.setMany({
      [bookKey(id, 'progress')]: '{}',
      [bookKey(id, 'bookmarks')]: '[]',
    });
  }
  return setup;
};

const keysOf = (setup: Awaited<ReturnType<typeof twoBooks>>, id: BookId) =>
  Object.keys(setup.kv.snapshot()).filter(key =>
    key.startsWith(bookPrefix(id)),
  );

describe('LocalBookRepository – deleteBook', () => {
  it('leaves no key and no file of the book, and keeps the other book', async () => {
    const setup = await twoBooks();
    const otherKeys = keysOf(setup, OTHER);
    await setup.repo.deleteBook(ID);

    expect(keysOf(setup, ID)).toEqual([]);
    expect(await setup.files.exists(setup.files.bookPdfPath(ID))).toBe(false);
    expect(keysOf(setup, OTHER)).toEqual(otherKeys);
    expect(await setup.files.exists(setup.files.bookPdfPath(OTHER))).toBe(true);
    expect((await setup.repo.listBooks()).map(b => b.id)).toEqual([OTHER]);
  });

  it('removes the book from the library before its keys and its file', async () => {
    const setup = await twoBooks();
    setup.kv.calls.length = 0;
    await setup.repo.deleteBook(ID);
    const writes = setup.kv.calls.filter(c => c.operation !== 'getMany');
    expect(writes.map(c => c.operation)).toEqual([
      'setMany',
      'getAllKeys',
      'removeMany',
    ]);
    expect(setup.files.calls.at(-1)).toEqual({
      operation: 'remove',
      path: setup.files.bookPdfPath(ID),
    });
  });

  it('finishes an interrupted delete when repeated', async () => {
    const setup = await twoBooks();
    setup.kv.failNext('removeMany');
    await expect(setup.repo.deleteBook(ID)).rejects.toThrow();
    expect((await setup.repo.listBooks()).map(b => b.id)).toEqual([OTHER]);

    await setup.repo.deleteBook(ID);
    expect(keysOf(setup, ID)).toEqual([]);
    expect(await setup.files.exists(setup.files.bookPdfPath(ID))).toBe(false);
  });

  it('is a no-op for an unknown book', async () => {
    const setup = await twoBooks();
    const before = setup.kv.snapshot();
    await setup.repo.deleteBook(BOOK_IDS[2] as BookId);
    expect(setup.kv.snapshot()).toEqual(before);
  });
});
