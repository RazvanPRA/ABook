import { configureStore } from '@reduxjs/toolkit';
import {
  libraryHydrated,
  libraryReducer,
  selectBookCount,
  selectBooksInOrder,
} from '@/features/library';
import { FakePdfTextExtractor, type FakePdf } from '@/services/pdf/testing';
import type { PageText } from '@/services/text';
import type { BookId } from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';
import { logger } from '@/shared/utils';
import { PICKED, book } from '../../__fixtures__/importSetup';
import { MemoryBookRepository } from '../../__fixtures__/memoryBookRepository';
import type { ImportDependencies } from '../../model/dependencies';
import { MAX_PDF_BYTES } from '../../model/limits';
import { importReducer } from '../importSlice';
import {
  cancelImport,
  importPdf,
  keepDuplicate,
  resumeImports,
} from '../thunks';

/** Book ids are uuids, so the stored path is unknown in advance: every opened path gets `pdf`. */
function serve(extractor: FakePdfTextExtractor, pdf: FakePdf) {
  const open = extractor.open.bind(extractor);
  jest.spyOn(extractor, 'open').mockImplementation(path => {
    extractor.addPdf(path, pdf);
    return open(path);
  });
}

function setup(pdf: FakePdf = { pages: book(30) }) {
  const bookRepository = new MemoryBookRepository();
  const pdfExtractor = new FakePdfTextExtractor();
  serve(pdfExtractor, pdf);
  const extra: ImportDependencies = { bookRepository, pdfExtractor };
  const store = configureStore({
    reducer: { import: importReducer, library: libraryReducer },
    middleware: getDefault => getDefault({ thunk: { extraArgument: extra } }),
  });
  const closed = () => pdfExtractor.calls.at(-1)?.call === 'close';
  return { store, repo: bookRepository, extractor: pdfExtractor, closed };
}

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

/** A page with exactly `chars` characters of text. */
const pageWith = (page: number, chars: number): PageText => ({
  page,
  lines: chars === 0 ? [] : [{ text: 'x'.repeat(chars), y: 0.5, height: 11 }],
});

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('importPdf', () => {
  it('imports with a fresh uuid, ends ready and closes the extractor', async () => {
    const { store, repo, closed } = setup();
    await store.dispatch(importPdf(PICKED));
    const { phase, bookId } = store.getState().import;
    expect(phase).toEqual({ type: 'ready' });
    expect(bookId).toMatch(/^[0-9a-f-]{36}$/);
    expect(selectBooksInOrder(store.getState())).toMatchObject([
      { id: bookId, status: 'ready', fingerprint: `fp:${PICKED.uri}` },
    ]);
    expect(repo.files.size).toBe(1);
    expect(closed()).toBe(true);
  });

  it('refuses a file over 100 MB before copying anything', async () => {
    const { store, repo } = setup();
    await store.dispatch(
      importPdf({ ...PICKED, sizeBytes: MAX_PDF_BYTES + 1 }),
    );
    expect(store.getState().import.phase).toEqual({
      type: 'failed',
      reason: 'too-large',
      step: 'copy',
    });
    expect(repo.calls).toEqual([]);
  });

  it('imports a PDF whose first pages are mostly empty (The Clean Coder shape)', async () => {
    const pages = [0, 1520, 30, 13, 443].map((chars, i) =>
      pageWith(i + 1, chars),
    );
    const { store } = setup({ pages: [...pages, ...book(10).slice(5)] });
    await store.dispatch(importPdf(PICKED));
    expect(store.getState().import.phase).toEqual({ type: 'ready' });
  });
});

const scan = [1, 2, 3, 4, 5, 6].map(page => pageWith(page, 19));

describe('importPdf failures leave no keys and no file', () => {
  it.each([
    ['copy', 'copy', { pages: book(5) }, ['storePdf', 0]],
    ['scanned', 'extract', { pages: scan }, null],
    ['corrupt', 'extract', { pages: [] }, null],
    ['password', 'extract', { pages: [], openError: 'password' }, null],
    ['corrupt', 'extract', { pages: [], openError: 'corrupt' }, null],
    ['timeout', 'extract', { pages: book(30), failAtPage: 26 }, null],
    ['storage', 'extract', { pages: book(30) }, ['saveChapter', 0]],
    ['storage', 'extract', { pages: book(30) }, ['saveToc', 1]],
    // page count, then processedPages 10, 20, 30: the 5th is the ready meta
    ['storage', 'save', { pages: book(30) }, ['updateMeta', 4]],
  ] as const)('%s at the %s step', async (reason, step, pdf, failing) => {
    const { store, repo, closed } = setup(pdf);
    if (failing) {
      repo.failOn(failing[0], failing[1]);
    }
    await store.dispatch(importPdf(PICKED));
    expect(store.getState().import.phase).toEqual({
      type: 'failed',
      reason,
      step,
    });
    expect(repo.isEmpty()).toBe(true);
    expect(selectBookCount(store.getState())).toBe(0);
    expect(closed()).toBe(true);
    expect(warn).toHaveBeenCalledWith('import failed', expect.anything());
  });
});

describe('cancelImport', () => {
  it('stops an import in the middle of extraction and removes what it wrote', async () => {
    const { store, repo, extractor } = setup();
    extractor.pauseAtPage(26);
    const running = store.dispatch(importPdf(PICKED));
    await tick();
    expect(repo.chapters.size).toBeGreaterThan(0);

    await store.dispatch(cancelImport());
    await running;
    expect(store.getState().import.phase).toEqual({
      type: 'cancelled',
      step: 'extract',
    });
    expect(repo.isEmpty()).toBe(true);
    expect(selectBookCount(store.getState())).toBe(0);
    expect(warn).not.toHaveBeenCalledWith('import failed', expect.anything());
  });

  it('is ignored when no import runs', async () => {
    const { store, repo } = setup();
    await store.dispatch(cancelImport());
    expect(store.getState().import.phase).toEqual({ type: 'idle' });
    expect(repo.calls).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      'import: importCancelled ignored in phase idle',
    );
  });
});

describe('duplicates', () => {
  async function importTwice() {
    const context = setup({ pages: book(12) });
    await context.store.dispatch(importPdf(PICKED));
    const first = context.store.getState().import.bookId;
    await context.store.dispatch(importPdf(PICKED));
    return { ...context, first };
  }

  it('waits for the user when the fingerprint matches a book in the library', async () => {
    const { store, repo, first, closed } = await importTwice();
    expect(store.getState().import.phase).toEqual({
      type: 'duplicate',
      existingBookId: first,
    });
    expect(selectBookCount(store.getState())).toBe(1);
    expect(repo.files.size).toBe(2); // the new copy, until the user decides
    expect(closed()).toBe(true);
  });

  it('imports a second copy when the user keeps it', async () => {
    const { store } = await importTwice();
    await store.dispatch(keepDuplicate());
    expect(store.getState().import.phase).toEqual({ type: 'ready' });
    expect(selectBookCount(store.getState())).toBe(2);
  });

  it('removes only the new copy when the user cancels', async () => {
    const { store, repo, first } = await importTwice();
    await store.dispatch(cancelImport());
    expect(store.getState().import.phase).toEqual({
      type: 'cancelled',
      step: 'copy',
    });
    expect(selectBooksInOrder(store.getState()).map(b => b.id)).toEqual([
      first,
    ]);
    expect([...repo.files]).toEqual([`/files/books/${first}.pdf`]);
  });

  it('ignores keepDuplicate when no duplicate is waiting', async () => {
    const { store, repo } = setup();
    await store.dispatch(keepDuplicate());
    expect(repo.calls).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      'import: keepDuplicate ignored in phase idle',
    );
  });
});

describe('resumeImports', () => {
  /** A book killed mid-import: `processing`, its file copied, no chapter yet. */
  async function killedBook(repo: MemoryBookRepository, id: BookId) {
    const stored = await repo.storePdf(id, `content://picker/${id}.pdf`);
    const meta = makeMeta(id, {
      fileUri: stored.path,
      title: `Carte ${id.slice(0, 4)}`,
    });
    await repo.createBook(meta);
    return meta;
  }

  it('resumes each processing book in turn and skips the others', async () => {
    const { store, repo, closed } = setup({ pages: book(12) });
    const [a, b] = [
      await killedBook(repo, BOOK_IDS[0] as BookId),
      await killedBook(repo, BOOK_IDS[1] as BookId),
    ];
    const ready = makeMeta(BOOK_IDS[2] as BookId, { status: 'ready' });
    store.dispatch(libraryHydrated([a, b, ready]));
    await store.dispatch(resumeImports([a, b, ready]));
    expect(
      selectBooksInOrder(store.getState()).map(m => [m.id, m.status]),
    ).toEqual([
      [a.id, 'ready'],
      [b.id, 'ready'],
      [ready.id, 'ready'],
    ]);
    expect(repo.metas.get(a.id)?.title).toBe(a.title);
    expect(store.getState().import).toMatchObject({
      phase: { type: 'ready' },
      bookId: b.id,
    });
    expect(closed()).toBe(true);
  });

  it('removes a book whose resume fails, like a new import', async () => {
    const { store, repo } = setup({ pages: [], openError: 'corrupt' });
    const meta = await killedBook(repo, BOOK_IDS[0] as BookId);
    store.dispatch(libraryHydrated([meta]));
    await store.dispatch(resumeImports([meta]));
    expect(store.getState().import.phase).toMatchObject({
      type: 'failed',
      reason: 'corrupt',
    });
    expect(repo.isEmpty()).toBe(true);
    expect(selectBookCount(store.getState())).toBe(0);
  });

  it('waits for the next boot while another import is running', async () => {
    const { store, repo } = setup({ pages: book(12) });
    await store.dispatch(importPdf(PICKED));
    await store.dispatch(importPdf(PICKED)); // a duplicate, waiting for the user
    const meta = await killedBook(repo, BOOK_IDS[0] as BookId);
    const calls = repo.calls.length;
    await store.dispatch(resumeImports([meta]));
    expect(repo.calls.length).toBe(calls);
    expect(store.getState().import.phase.type).toBe('duplicate');
    expect(warn).toHaveBeenCalledWith(
      'import: resume postponed, another import is running',
    );
  });
});
