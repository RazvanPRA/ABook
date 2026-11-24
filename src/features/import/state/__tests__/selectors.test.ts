import type { BookId } from '@/shared/domain';
import { BOOK_IDS } from '@/shared/domain/__fixtures__/books';
import {
  chapterSaved,
  documentOpened,
  duplicateFound,
  extractionFinished,
  fileCopied,
  formChanged,
  importFailed,
  importFinished,
  importReducer,
  importStarted,
  importSubmitted,
  pagesExtracted,
  savingStarted,
} from '../importSlice';
import { initialImportState } from '../importState';
import {
  selectCanListen,
  selectCanSubmit,
  selectExtractProgress,
  selectImport,
  selectImportFailure,
  selectImportPhase,
  selectImportSteps,
  selectIsImporting,
} from '../selectors';

const [BOOK, OTHER] = BOOK_IDS as [BookId, BookId];
const FILE = { name: 'a.pdf', uri: 'content://a', sizeBytes: 10 };

const STORED_PDF = {
  path: '/files/books/x.pdf',
  sizeBytes: 10,
  fingerprint: '10:ab',
};

type Action = Parameters<typeof importReducer>[1];
const root = (...actions: readonly Action[]) => ({
  import: actions.reduce(importReducer, initialImportState),
});

const started = importStarted({ bookId: BOOK, file: FILE });
const extracting: readonly Action[] = [
  started,
  fileCopied(STORED_PDF),
  documentOpened({ pageCount: 200, title: null, author: null }),
];
const ready: readonly Action[] = [
  ...extracting,
  extractionFinished(),
  savingStarted(),
  importFinished(),
];

describe('import selectors', () => {
  it('read the slice and its phase', () => {
    const state = root(started);
    expect(selectImport(state)).toBe(state.import);
    expect(selectImportPhase(state)).toEqual({ type: 'copying' });
  });

  it('memoize the step list until the phase changes', () => {
    const state = root(...extracting);
    expect(selectImportSteps(state)).toBe(selectImportSteps(state));
    const typed = {
      import: importReducer(
        state.import,
        formChanged({ field: 'author', value: 'X' }),
      ),
    };
    expect(selectImportSteps(typed)).toBe(selectImportSteps(state));
    expect(selectImportSteps(state)[1]?.progress).toEqual({
      page: 0,
      total: 200,
    });
  });

  it('tell whether an import runs, and why it failed', () => {
    expect(selectIsImporting(root())).toBe(false);
    expect(
      selectIsImporting(
        root(
          started,
          duplicateFound({ existingBookId: OTHER, stored: STORED_PDF }),
        ),
      ),
    ).toBe(true);
    expect(selectIsImporting(root(...ready))).toBe(false);
    expect(selectImportFailure(root(...extracting))).toBeNull();
    expect(
      selectImportFailure(root(...extracting, importFailed('scanned'))),
    ).toBe('scanned');
  });

  it('allow listening once a chapter is saved, until the import fails', () => {
    expect(selectCanListen(root(...extracting))).toBe(false);
    expect(selectCanListen(root(...extracting, chapterSaved()))).toBe(true);
    expect(
      selectCanListen(
        root(
          ...extracting,
          chapterSaved(),
          extractionFinished(),
          savingStarted(),
          importFinished(),
        ),
      ),
    ).toBe(true);
    expect(
      selectCanListen(
        root(...extracting, chapterSaved(), importFailed('timeout')),
      ),
    ).toBe(false);
  });

  it('enable the submit button while running or ready, with a title, once', () => {
    expect(selectCanSubmit(root())).toBe(false);
    expect(selectCanSubmit(root(started))).toBe(true);
    expect(
      selectCanSubmit(
        root(
          started,
          duplicateFound({ existingBookId: OTHER, stored: STORED_PDF }),
        ),
      ),
    ).toBe(false);
    expect(selectCanSubmit(root(...ready))).toBe(true);
    expect(selectCanSubmit(root(...extracting, importSubmitted()))).toBe(false);
    expect(
      selectCanSubmit(
        root(started, formChanged({ field: 'title', value: ' ' })),
      ),
    ).toBe(false);
    expect(selectCanSubmit(root(...extracting, importFailed('corrupt')))).toBe(
      false,
    );
  });

  it('give the extraction progress from 0 to 1', () => {
    expect(selectExtractProgress(root(started))).toBe(0);
    expect(selectExtractProgress(root(...extracting, pagesExtracted(50)))).toBe(
      0.25,
    );
    expect(
      selectExtractProgress(
        root(
          started,
          fileCopied(STORED_PDF),
          documentOpened({ pageCount: 0, title: null, author: null }),
        ),
      ),
    ).toBe(0);
    expect(
      selectExtractProgress(root(...extracting, extractionFinished())),
    ).toBe(1);
    expect(selectExtractProgress(root(...ready))).toBe(1);
  });
});
