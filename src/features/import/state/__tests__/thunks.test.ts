import { configureStore } from '@reduxjs/toolkit';
import { libraryReducer, selectBookCount } from '@/features/library';
import { FakePdfTextExtractor } from '@/services/pdf/testing';
import { logger } from '@/shared/utils';
import { PICKED, book } from '../../__fixtures__/importSetup';
import { MemoryBookRepository } from '../../__fixtures__/memoryBookRepository';
import type { ImportDependencies } from '../../model/dependencies';
import { importReducer } from '../importSlice';
import { importPdf } from '../thunks';

function setup() {
  const bookRepository = new MemoryBookRepository();
  const pdfExtractor = new FakePdfTextExtractor();
  const extra: ImportDependencies = { bookRepository, pdfExtractor };
  const store = configureStore({
    reducer: { import: importReducer, library: libraryReducer },
    middleware: getDefault => getDefault({ thunk: { extraArgument: extra } }),
  });
  return { store, bookRepository, pdfExtractor };
}

const storedPath = (repo: MemoryBookRepository) =>
  repo.calls.flatMap(call =>
    call.op === 'storePdf' ? [`/files/books/${call.id}.pdf`] : [],
  )[0] ?? '';

describe('importPdf', () => {
  it('imports with a fresh uuid, ends ready and closes the extractor', async () => {
    const { store, bookRepository, pdfExtractor } = setup();
    // The id is only known once the file is stored: register the PDF on every path
    const open = pdfExtractor.open.bind(pdfExtractor);
    jest.spyOn(pdfExtractor, 'open').mockImplementation(path => {
      pdfExtractor.addPdf(path, { pages: book(12) });
      return open(path);
    });
    await store.dispatch(importPdf(PICKED));
    expect(store.getState().import.phase).toEqual({ type: 'ready' });
    expect(store.getState().import.bookId).toMatch(/^[0-9a-f-]{36}$/);
    expect(storedPath(bookRepository)).toContain(
      store.getState().import.bookId,
    );
    expect(selectBookCount(store.getState())).toBe(1);
    expect(pdfExtractor.calls.at(-1)?.call).toBe('close');
  });

  it('marks the import failed on any error and still closes the extractor', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    const { store, pdfExtractor } = setup();
    await store.dispatch(importPdf(PICKED)); // no PDF registered: open rejects
    expect(store.getState().import.phase).toEqual({
      type: 'failed',
      reason: 'unknown',
      step: 'extract',
    });
    expect(pdfExtractor.calls.at(-1)?.call).toBe('close');
    expect(warn).toHaveBeenCalledWith('import failed', expect.anything());
    warn.mockRestore();
  });
});
