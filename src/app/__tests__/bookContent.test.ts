import {
  loadBookContent,
  removeBookmark,
  resetProgress,
  selectBookContent,
} from '@/features/book';
import {
  bookRemoved,
  bookUpserted,
  selectBookProgress,
} from '@/features/library';
import {
  bookmarksSchema,
  tocSchema,
  type BookId,
  type Chapter,
} from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';
import { makeProgress } from '@/shared/domain/__fixtures__/progress';
import { NOW, rawChapter } from '@/shared/domain/__fixtures__/rawValues';
import { logger } from '@/shared/utils';
import { fakeApp } from '../__fixtures__/fakeApp';

const [A, B] = BOOK_IDS as [BookId, BookId];
const TOC = tocSchema.parse([rawChapter(), rawChapter({ index: 1 })]);
const MARKS = bookmarksSchema.parse(
  ['a', 'b'].map(id => ({
    id,
    chapter: 0,
    sentence: 2,
    page: 27,
    excerpt: 'Și după ce…',
    createdAt: NOW,
  })),
);

async function setup() {
  const app = fakeApp();
  const { bookRepository, progressRepository } = app.services;
  for (const id of [A, B]) {
    await bookRepository.createBook(makeMeta(id));
    app.store.dispatch(bookUpserted(makeMeta(id)));
  }
  await bookRepository.saveToc(A, TOC);
  await progressRepository.saveBookmarks(A, MARKS);
  const content = (id: BookId) => selectBookContent(app.store.getState(), id);
  return { ...app, content, bookRepository, progressRepository };
}

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('loadBookContent', () => {
  it('reads the toc and the bookmarks; a book without them has empty ones', async () => {
    const { store, content } = await setup();
    expect(content(A)).toBeNull();
    await store.dispatch(loadBookContent(A));
    await store.dispatch(loadBookContent(B));
    expect(content(A)).toMatchObject({ toc: TOC, bookmarks: MARKS });
    expect(content(B)).toMatchObject({ toc: [], bookmarks: [] });
  });

  it('keeps the old content while it reads again', async () => {
    const { store, content } = await setup();
    await store.dispatch(loadBookContent(A));
    const reading = store.dispatch(loadBookContent(A));
    expect(content(A)?.toc).toEqual(TOC);
    await reading;
  });

  it('ignores an older answer that comes after a newer one', async () => {
    const { store, content, bookRepository } = await setup();
    const answers: ((toc: Chapter[]) => void)[] = [];
    jest
      .spyOn(bookRepository, 'getToc')
      .mockImplementation(() => new Promise(resolve => answers.push(resolve)));
    const older = store.dispatch(loadBookContent(A));
    const newer = store.dispatch(loadBookContent(A));
    answers[1]?.(TOC);
    await newer;
    answers[0]?.(TOC.slice(0, 1));
    await older;
    expect(content(A)?.toc).toEqual(TOC);
  });

  it('does not bring back a book deleted meanwhile, nor mix two books', async () => {
    const { store, content } = await setup();
    const reading = [A, B].map(id => store.dispatch(loadBookContent(id)));
    store.dispatch(bookRemoved(A));
    await Promise.all(reading);
    expect(store.getState().bookContent[A]).toBeUndefined();
    expect(content(B)?.toc).toEqual([]);
  });

  it('shows what it can when a read fails', async () => {
    const { store, content, bookRepository } = await setup();
    jest.spyOn(bookRepository, 'getToc').mockRejectedValue(new Error('disk'));
    await store.dispatch(loadBookContent(A));
    expect(content(A)).toMatchObject({ toc: [], bookmarks: MARKS });
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('removeBookmark', () => {
  it('removes it from the screen and from storage', async () => {
    const { store, content, progressRepository } = await setup();
    await store.dispatch(loadBookContent(A));
    await store.dispatch(removeBookmark(A, 'a'));
    expect(content(A)?.bookmarks.map(m => m.id)).toEqual(['b']);
    expect((await progressRepository.getBookmarks(A)).map(m => m.id)).toEqual([
      'b',
    ]);
  });

  it('brings it back when it cannot be written', async () => {
    const { store, content, kv } = await setup();
    await store.dispatch(loadBookContent(A));
    kv.failNext('setMany');
    await store.dispatch(removeBookmark(A, 'a'));
    expect(content(A)?.bookmarks).toEqual(MARKS);
  });

  it('writes nothing for a book being deleted or deleted', async () => {
    const { store, progressRepository } = await setup();
    const save = jest.spyOn(progressRepository, 'saveBookmarks');
    await store.dispatch(loadBookContent(A));
    store.dispatch({ type: 'bookDeletion/deletionStarted', payload: A });
    await store.dispatch(removeBookmark(A, 'a'));
    store.dispatch(bookRemoved(A));
    await store.dispatch(removeBookmark(A, 'a'));
    expect(save).not.toHaveBeenCalled();
  });
});

describe('resetProgress', () => {
  it('forgets where listening stopped, in storage too', async () => {
    const { store, progressRepository } = await setup();
    await progressRepository.saveProgress(A, makeProgress());
    expect(await store.dispatch(resetProgress(A))).toBe(true);
    expect(await progressRepository.getProgress(A)).toBeNull();
    expect(selectBookProgress(store.getState(), A)).toBeNull();
  });

  it('keeps it when storage fails', async () => {
    const { store, kv, progressRepository } = await setup();
    await progressRepository.saveProgress(A, makeProgress());
    kv.failNext('removeMany');
    expect(await store.dispatch(resetProgress(A))).toBe(false);
    expect(await progressRepository.getProgress(A)).not.toBeNull();
  });
});
