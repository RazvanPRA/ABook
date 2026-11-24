import {
  addBookmark,
  deleteBook,
  loadBookContent,
  removeBookmark,
  selectBookContent,
} from '@/features/book';
import { toChapterIndex, toPageNumber, toSentenceIndex } from '@/shared/domain';
import { A, playerApp } from '../__fixtures__/playerApp';

const place = (chapter: number, sentence: number) => ({
  chapter: toChapterIndex(chapter),
  sentence: toSentenceIndex(sentence),
  page: toPageNumber(chapter + 1),
  text: `Fraza ${chapter}.${sentence}`,
});

async function setup() {
  const app = await playerApp({});
  await app.store.dispatch(loadBookContent(A));
  return {
    ...app,
    add: (chapter: number, sentence: number) =>
      app.store.dispatch(addBookmark(A, place(chapter, sentence))),
    shown: () => selectBookContent(app.store.getState(), A)?.bookmarks ?? [],
    inStorage: () => app.services.progressRepository.getBookmarks(A),
  };
}

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

it('adds in the order of the book, with an excerpt, and stores it', async () => {
  const app = await setup();
  expect(await app.add(1, 0)).toBe(true);
  expect(await app.add(0, 2)).toBe(true);
  expect(app.shown().map(({ excerpt }) => excerpt)).toEqual([
    'Fraza 0.2',
    'Fraza 1.0',
  ]);
  expect(await app.inStorage()).toEqual(app.shown());
});

it('a second one of the same sentence changes nothing', async () => {
  const app = await setup();
  await app.add(0, 1);
  const before = app.shown();
  expect(await app.add(0, 1)).toBe(true);
  expect(app.shown()).toEqual(before);
});

it('is taken back when it can not be written', async () => {
  const app = await setup();
  await app.add(0, 1);
  app.kv.failNext('setMany');
  expect(await app.add(0, 2)).toBe(false);
  expect(app.shown()).toHaveLength(1);
  expect(await app.inStorage()).toHaveLength(1);
});

it('added while a removal waits for its undo, both are right after', async () => {
  const app = await setup();
  await app.add(0, 1);
  const [first] = app.shown();
  await app.add(0, 2);
  await app.store.dispatch(removeBookmark(A, first?.id ?? ''));
  expect((await app.inStorage()).map(({ sentence }) => sentence)).toEqual([2]);
});

it('survives a read of the content that started before', async () => {
  const app = await setup();
  const reading = app.store.dispatch(loadBookContent(A));
  const adding = app.add(0, 1);
  await Promise.all([reading, adding]);
  expect(app.shown()).toHaveLength(1);
});

it('is refused for a book being deleted or unknown', async () => {
  const app = await setup();
  const deleting = app.store.dispatch(deleteBook(A));
  expect(await app.add(0, 1)).toBe(false);
  await deleting;
  expect(await app.add(0, 1)).toBe(false);
  expect(app.keysOf()).toEqual([]);
});
