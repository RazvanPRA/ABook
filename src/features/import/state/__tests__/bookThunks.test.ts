import { configureStore } from '@reduxjs/toolkit';
import {
  libraryHydrated,
  libraryReducer,
  selectBookById,
  selectBookCount,
} from '@/features/library';
import { FakePdfTextExtractor, type FakePdf } from '@/services/pdf/testing';
import { FakePdfPicker } from '@/services/picker/testing';
import type { BookId, BookMeta } from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';
import { logger } from '@/shared/utils';
import { PICKED, book } from '../../__fixtures__/importSetup';
import { MemoryBookRepository } from '../../__fixtures__/memoryBookRepository';
import type { ImportDependencies } from '../../model/dependencies';
import { cancelImportOf, continueImport } from '../bookThunks';
import { importReducer } from '../importSlice';
import { selectImportingBookId } from '../selectors';
import { importPdf, resumeImports } from '../thunks';

const [A, B] = BOOK_IDS as [BookId, BookId];
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

function setup(pdf: FakePdf = { pages: book(30) }) {
  const repo = new MemoryBookRepository();
  const extractor = new FakePdfTextExtractor();
  const served = { pdf };
  const open = extractor.open.bind(extractor);
  jest.spyOn(extractor, 'open').mockImplementation(path => {
    extractor.addPdf(path, served.pdf);
    return open(path);
  });
  const extra: ImportDependencies = {
    bookRepository: repo,
    pdfExtractor: extractor,
    pdfPicker: new FakePdfPicker(),
  };
  const store = configureStore({
    reducer: { import: importReducer, library: libraryReducer },
    middleware: getDefault => getDefault({ thunk: { extraArgument: extra } }),
  });
  const statusOf = (id: BookId) => selectBookById(store.getState(), id)?.status;
  return { store, repo, extractor, served, statusOf };
}
type Setup = ReturnType<typeof setup>;

/** Books as a killed import left them, in the library and in storage. */
async function storedBooks(
  { store, repo }: Setup,
  ids: readonly BookId[],
  overrides: Partial<BookMeta> = {},
) {
  const metas: BookMeta[] = [];
  for (const id of ids) {
    const { path } = await repo.storePdf(id, `content://picker/${id}.pdf`);
    const meta = makeMeta(id, { fileUri: path, ...overrides });
    await repo.createBook(meta);
    metas.push(meta);
  }
  store.dispatch(libraryHydrated(metas));
  return metas;
}

/** What the delete does after the cancel. */
const leftovers = (repo: MemoryBookRepository, id: BookId) => [
  ...[...repo.chapters.keys()].filter(key => key.startsWith(id)),
  ...[...repo.files].filter(file => file.includes(id)),
  ...[repo.metas, repo.tocs].filter(map => map.has(id)),
];

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('cancelImportOf', () => {
  it('stops the import in the middle of extraction and waits for its cleanup', async () => {
    const { store, repo, extractor } = setup();
    extractor.pauseAtPage(26);
    const running = store.dispatch(importPdf(PICKED));
    await tick();
    const id = selectImportingBookId(store.getState()) as BookId;
    expect(repo.chapters.size).toBeGreaterThan(0);

    await store.dispatch(cancelImportOf(id));
    expect(repo.isEmpty()).toBe(true); // already, without waiting for the import's promise
    expect(selectBookCount(store.getState())).toBe(0);
    expect(selectImportingBookId(store.getState())).toBeNull();
    await running;
  });

  it('removes the copy of an import waiting on a duplicate', async () => {
    const { store, repo } = setup({ pages: book(12) });
    await store.dispatch(importPdf(PICKED));
    await store.dispatch(importPdf(PICKED));
    const id = selectImportingBookId(store.getState()) as BookId;
    await store.dispatch(cancelImportOf(id));
    expect(leftovers(repo, id)).toEqual([]);
    expect(repo.files.size).toBe(1);
  });

  it('does not touch nor wait for the import of another book', async () => {
    const all = setup();
    const { store, extractor, statusOf } = all;
    const metas = await storedBooks(all, [A, B]);
    extractor.pauseAtPage(1);
    const resuming = store.dispatch(resumeImports(metas));
    await tick();
    expect(selectImportingBookId(store.getState())).toBe(A);

    await store.dispatch(cancelImportOf(B));
    expect(selectImportingBookId(store.getState())).toBe(A);
    extractor.resume();
    await resuming;
    expect(statusOf(A)).toBe('ready');
    expect(statusOf(B)).toBe('processing'); // discarded while queued: never started
  });

  it('lets the remaining books resume when the one resuming is deleted', async () => {
    const all = setup();
    const { store, repo, extractor, statusOf } = all;
    const metas = await storedBooks(all, [A, B]);
    extractor.pauseAtPage(26);
    const resuming = store.dispatch(resumeImports(metas));
    await tick();
    await store.dispatch(cancelImportOf(A));
    expect(leftovers(repo, A)).toEqual([]);
    await resuming;
    expect(statusOf(B)).toBe('ready');
    expect(leftovers(repo, A)).toEqual([]);
  });

  it('stops a resume that has not told the slice about its book yet', async () => {
    const all = setup();
    const { store, repo } = all;
    const metas = await storedBooks(all, [A]);
    let answer = () => {};
    jest.spyOn(repo, 'getToc').mockImplementation(
      () =>
        new Promise(resolve => {
          answer = () => resolve(null);
        }),
    );
    const resuming = store.dispatch(resumeImports(metas));
    const cancelling = store.dispatch(cancelImportOf(A));
    answer();
    await Promise.all([resuming, cancelling]);
    expect(store.getState().import.phase.type).toBe('idle');
    expect(repo.chapters.size).toBe(0);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('continueImport', () => {
  it('ends like an uninterrupted import after a transient failure', async () => {
    const whole = setup();
    const [only] = await storedBooks(whole, [A]);
    await whole.store.dispatch(resumeImports([only as BookMeta]));

    const all = setup({ pages: book(30), failAtPage: 26 });
    const metas = await storedBooks(all, [A]);
    await all.store.dispatch(resumeImports(metas));
    expect(all.statusOf(A)).toBe('processing'); // stalled
    expect(selectImportingBookId(all.store.getState())).toBeNull();

    all.served.pdf = { pages: book(30) };
    await all.store.dispatch(continueImport(A));
    expect(all.repo.metas).toEqual(whole.repo.metas);
    expect(all.repo.tocs).toEqual(whole.repo.tocs);
    expect(all.repo.chapters).toEqual(whole.repo.chapters);
  });

  it('retries a failed book whose reason is unknown, clearing the status', async () => {
    const all = setup();
    await storedBooks(all, [A], { status: 'failed' });
    all.extractor.pauseAtPage(1);
    const running = all.store.dispatch(continueImport(A));
    await tick();
    expect(all.statusOf(A)).toBe('processing');
    all.extractor.resume();
    await running;
    expect(all.repo.metas.get(A)).toMatchObject({
      status: 'ready',
      failure: null,
    });
  });

  it.each([
    ['timeout', { status: 'processing', failure: null }],
    ['corrupt', { status: 'failed', failure: 'corrupt' }],
  ] as const)('fails again (%s)', async (openError, expected) => {
    const all = setup({ pages: [], openError });
    await storedBooks(all, [A]);
    await all.store.dispatch(continueImport(A));
    expect(all.repo.metas.get(A)).toMatchObject(expected);
    expect(selectBookById(all.store.getState(), A)).toMatchObject(expected);
  });

  it('marks a book whose PDF is gone', async () => {
    const all = setup();
    const [meta] = await storedBooks(all, [A]);
    all.repo.files.delete((meta as BookMeta).fileUri);
    await all.store.dispatch(continueImport(A));
    expect(selectBookById(all.store.getState(), A)).toMatchObject({
      status: 'failed',
      failure: 'missing-file',
    });
    expect(all.extractor.calls.map(c => c.call)).not.toContain('open');
  });

  it.each([
    ['ready', { status: 'ready' }],
    ['permanently failed', { status: 'failed', failure: 'scanned' }],
  ] as const)('ignores a %s book', async (_case, overrides) => {
    const all = setup();
    await storedBooks(all, [A], overrides);
    await all.store.dispatch(continueImport(A));
    expect(all.extractor.calls.map(c => c.call)).not.toContain('open');
  });

  it('ignores an unknown book and one being deleted', async () => {
    const all = setup();
    await storedBooks(all, [A]);
    await all.store.dispatch(cancelImportOf(A));
    await all.store.dispatch(continueImport(A));
    await all.store.dispatch(continueImport(B));
    expect(all.extractor.calls.map(c => c.call)).not.toContain('open');
  });

  it('is ignored while another import runs', async () => {
    const all = setup();
    const metas = await storedBooks(all, [A, B]);
    all.extractor.pauseAtPage(1);
    const resuming = all.store.dispatch(resumeImports(metas.slice(0, 1)));
    await tick();
    await all.store.dispatch(continueImport(B));
    expect(all.statusOf(B)).toBe('processing');
    all.extractor.resume();
    await resuming;
    expect(all.statusOf(B)).toBe('processing');
  });
});
