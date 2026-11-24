import { deleteBook } from '@/features/book';
import {
  importPdf,
  resumeImports,
  selectImportingBookId,
} from '@/features/import';
import { bookUpserted, selectBookById } from '@/features/library';
import { toChapterIndex, type BookId, type BookMeta } from '@/shared/domain';
import { makeProgress } from '@/shared/domain/__fixtures__/progress';
import {
  BOOK_IDS,
  SOURCE_SIZE,
  SOURCE_URI,
  makeChunk,
  makeMeta,
} from '@/repositories/__fixtures__/books';
import { bookPrefix } from '@/storage';
import { fakeApp } from '../__fixtures__/fakeApp';

const [A, B] = BOOK_IDS as [BookId, BookId];
const tick = () => new Promise(resolve => setTimeout(resolve, 5));

function setup() {
  const app = fakeApp();
  app.files.addFile(SOURCE_URI, SOURCE_SIZE);
  const add = async (id: BookId, overrides: Partial<BookMeta> = {}) => {
    const { bookRepository, progressRepository } = app.services;
    const { path } = await bookRepository.storePdf(id, SOURCE_URI);
    const meta = makeMeta(id, { fileUri: path, ...overrides });
    await bookRepository.createBook({ ...meta, status: 'processing' });
    await bookRepository.updateMeta(id, { status: meta.status });
    await bookRepository.saveChapter(id, toChapterIndex(0), makeChunk(5000));
    await progressRepository.saveProgress(id, makeProgress());
    app.store.dispatch(bookUpserted(meta));
    return meta;
  };
  const left = (id: BookId) => [
    ...Object.entries(app.kv.snapshot())
      .filter(([key, value]) => key.includes(id) || value.includes(id))
      .map(([key]) => key),
    ...app.files.filePaths().filter(path => path.includes(id)),
  ];
  return { ...app, add, left };
}

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('deleteBook', () => {
  it.each(['ready', 'failed', 'processing'] as const)(
    'leaves nothing of a %s book and keeps the others',
    async status => {
      const { store, add, left } = setup();
      await add(A, { status });
      await add(B, { status: 'ready' });
      const others = left(B);
      expect(await store.dispatch(deleteBook(A))).toBe(true);
      expect(left(A)).toEqual([]);
      expect(left(B)).toEqual(others);
      expect(selectBookById(store.getState(), A)).toBeNull();
      expect(store.getState().bookDeletion).toEqual({});
    },
  );

  it('leaves nothing of a book being imported', async () => {
    const { store, kv, files, extractor, left } = setup();
    const before = { keys: kv.snapshot(), files: files.filePaths() };
    extractor.pauseAtPage(26);
    const running = store.dispatch(
      importPdf({ name: 'a.pdf', uri: SOURCE_URI, sizeBytes: SOURCE_SIZE }),
    );
    await tick();
    const id = selectImportingBookId(store.getState()) as BookId;
    expect(left(id).length).toBeGreaterThan(3);
    expect(await store.dispatch(deleteBook(id))).toBe(true);
    await running;
    expect(left(id)).toEqual([]);
    expect(files.filePaths()).toEqual(before.files);
    expect(
      Object.keys(kv.snapshot()).filter(key => key.startsWith(bookPrefix(id))),
    ).toEqual([]);
  });

  it('leaves nothing of a book queued behind another resume, which goes on', async () => {
    const { store, add, left, extractor } = setup();
    const metas = [await add(A), await add(B)];
    extractor.pauseAtPage(1);
    const resuming = store.dispatch(resumeImports(metas));
    await tick();
    expect(await store.dispatch(deleteBook(B))).toBe(true);
    extractor.resume();
    await resuming;
    expect(left(B)).toEqual([]);
    expect(selectBookById(store.getState(), A)?.status).toBe('ready');
  });
});

describe('deleteBook when storage fails', () => {
  it.each([
    ['the order', 'kv', 'setMany'],
    ['the key list', 'kv', 'getAllKeys'],
    ['the keys', 'kv', 'removeMany'],
    ['the file', 'files', 'remove'],
  ] as const)('retries once at %s', async (_step, target, operation) => {
    const app = setup();
    await app.add(A, { status: 'ready' });
    if (target === 'kv') {
      app.kv.failNext(operation as 'setMany');
    } else {
      app.files.failNext('remove');
    }
    expect(await app.store.dispatch(deleteBook(A))).toBe(true);
    expect(app.left(A)).toEqual([]);
  });

  it('reports a second failure, keeps the book and can be repeated', async () => {
    const { store, services, add, left } = setup();
    await add(A, { status: 'ready' });
    const remove = jest
      .spyOn(services.bookRepository, 'deleteBook')
      .mockRejectedValueOnce(new Error('disk'))
      .mockRejectedValueOnce(new Error('disk'));
    expect(await store.dispatch(deleteBook(A))).toBe(false);
    expect(remove).toHaveBeenCalledTimes(2);
    expect(store.getState().bookDeletion).toEqual({ [A]: 'failed' });
    expect(selectBookById(store.getState(), A)).not.toBeNull();

    expect(await store.dispatch(deleteBook(A))).toBe(true);
    expect(left(A)).toEqual([]);
    expect(store.getState().bookDeletion).toEqual({});
  });

  it('ignores a second delete while the first one runs', async () => {
    const { store, services, add } = setup();
    await add(A, { status: 'ready' });
    const remove = jest.spyOn(services.bookRepository, 'deleteBook');
    const first = store.dispatch(deleteBook(A));
    expect(await store.dispatch(deleteBook(A))).toBe(false);
    expect(await first).toBe(true);
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
