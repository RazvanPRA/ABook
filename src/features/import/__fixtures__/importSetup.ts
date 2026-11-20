import { configureStore } from '@reduxjs/toolkit';
import { libraryReducer } from '@/features/library';
import { FakePdfTextExtractor } from '@/services/pdf/testing';
import type { PageLine, PageText } from '@/services/text';
import { BOOK_IDS } from '@/shared/domain/__fixtures__/books';
import type { BookId } from '@/shared/domain';
import type { ImportContext } from '../model/dependencies';
import { importReducer } from '../state/importSlice';
import { MemoryBookRepository } from './memoryBookRepository';

export const BOOK = BOOK_IDS[0] as BookId;
export const SOURCE = 'content://picker/ion-rebreanu.pdf';
export const STORED = `/files/books/${BOOK}.pdf`;
export const PICKED = {
  name: 'ion-rebreanu.pdf',
  uri: SOURCE,
  sizeBytes: 3_800_000,
};

const line = (text: string, y: number, height = 11): PageLine => ({
  text,
  y,
  height,
});

/**
 * A printed page of the sample book: running title, a heading when given, two body sentences and
 * the page number. Every sentence names its page, so tests can tell where text came from.
 */
export function bookPage(page: number, heading?: string): PageText {
  return {
    page,
    lines: [
      line('Ion - roman de test', 0.04, 9),
      ...(heading ? [line(heading, 0.09, 18)] : []),
      line(`Ion a mers pe drum la pagina ${page}.`, 0.3),
      line(`Ana privea câmpul de pe pagina ${page}.`, 0.32),
      line(String(page), 0.96, 9),
    ],
  };
}

/** `count` pages; `headings` maps a page to its chapter heading. */
export function book(
  count: number,
  headings: Readonly<Record<number, string>> = {},
): PageText[] {
  return Array.from({ length: count }, (_, i) =>
    bookPage(i + 1, headings[i + 1]),
  );
}

/** A store with the import and library slices, the real reducers. */
export function createTestStore() {
  return configureStore({
    reducer: { import: importReducer, library: libraryReducer },
  });
}

/** The pipeline's context over in-memory fakes and a real store; the yield is counted. */
export function createImportContext() {
  const store = createTestStore();
  const repo = new MemoryBookRepository();
  const extractor = new FakePdfTextExtractor();
  const yieldToJs = jest.fn(async () => undefined);
  const context: ImportContext = {
    bookRepository: repo,
    pdfExtractor: extractor,
    dispatch: action => store.dispatch(action),
    getForm: () => store.getState().import.form,
    isCancelled: () => store.getState().import.phase.type === 'cancelled',
    newBookId: () => BOOK,
    now: () => new Date('2026-11-20T10:00:00.000Z'),
    yieldToJs,
  };
  return { store, repo, extractor, context, yieldToJs };
}
