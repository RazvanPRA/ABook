import type { BookId } from '@/shared/domain';
import { BOOK_IDS } from '@/shared/domain/__fixtures__/books';
import { logger } from '@/shared/utils';
import {
  chapterSaved,
  documentOpened,
  duplicateFound,
  duplicateKept,
  extractionFinished,
  fileCopied,
  formChanged,
  importCancelled,
  importFailed,
  importFinished,
  importReducer,
  importReset,
  importStarted,
  importSubmitted,
  initialImportState,
  languageChanged,
  pagesExtracted,
  savingStarted,
  type ImportState,
} from '../importSlice';

const [BOOK, OTHER] = BOOK_IDS as [BookId, BookId];
const FILE = {
  name: 'ion-rebreanu.pdf',
  uri: 'content://x/1',
  sizeBytes: 3_800_000,
};

type Action = Parameters<typeof importReducer>[1];
const run = (...actions: readonly Action[]): ImportState =>
  actions.reduce(importReducer, initialImportState);

const started = importStarted({ bookId: BOOK, file: FILE });
const opened = (
  title: string | null = 'Ion',
  author: string | null = 'Liviu Rebreanu',
) => documentOpened({ pageCount: 412, title, author });
const toExtracting: readonly Action[] = [started, fileCopied(), opened()];
const toSaving: readonly Action[] = [
  ...toExtracting,
  extractionFinished(),
  savingStarted(),
];

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('importSlice happy path', () => {
  it('starts idle with an empty form in Romanian', () => {
    expect(initialImportState.phase).toEqual({ type: 'idle' });
    expect(initialImportState.form).toEqual({
      title: '',
      author: '',
      language: 'ro-RO',
    });
  });

  it('starts copying, with the file, the book id and a title from the file name', () => {
    const state = run(started);
    expect(state.phase).toEqual({ type: 'copying' });
    expect(state.bookId).toBe(BOOK);
    expect(state.file).toEqual(FILE);
    expect(state.form.title).toBe('ion-rebreanu');
  });

  it('goes copy → open → extract → split → save → ready', () => {
    const phases = [
      run(started, fileCopied()),
      run(...toExtracting),
      run(...toExtracting, pagesExtracted(186)),
      run(...toExtracting, extractionFinished()),
      run(...toSaving),
      run(...toSaving, importFinished()),
    ].map(state => state.phase);
    expect(phases).toEqual([
      { type: 'opening' },
      { type: 'extracting', page: 0, total: 412 },
      { type: 'extracting', page: 186, total: 412 },
      { type: 'splitting' },
      { type: 'saving' },
      { type: 'ready' },
    ]);
    expect(run(...toExtracting).pageCount).toBe(412);
    expect(warn).not.toHaveBeenCalled();
  });

  it('counts the chapters saved while extracting, splitting and saving', () => {
    const state = run(
      ...toExtracting,
      chapterSaved(),
      extractionFinished(),
      chapterSaved(),
      savingStarted(),
      chapterSaved(),
    );
    expect(state.chaptersSaved).toBe(3);
  });

  it('never moves page progress back nor past the last page', () => {
    expect(
      run(...toExtracting, pagesExtracted(20), pagesExtracted(10)).phase,
    ).toMatchObject({ page: 20 });
    expect(run(...toExtracting, pagesExtracted(999)).phase).toMatchObject({
      page: 412,
    });
  });

  it('waits on a duplicate, then opens when the user keeps a copy', () => {
    expect(run(started, duplicateFound(OTHER)).phase).toEqual({
      type: 'duplicate',
      existingBookId: OTHER,
    });
    expect(run(started, duplicateFound(OTHER), duplicateKept()).phase).toEqual({
      type: 'opening',
    });
  });
});

describe('importSlice form', () => {
  it('prefills title and author from the PDF metadata', () => {
    expect(run(...toExtracting).form).toEqual({
      title: 'Ion',
      author: 'Liviu Rebreanu',
      language: 'ro-RO',
    });
  });

  it('keeps what the user typed over the metadata', () => {
    const typed = run(
      started,
      formChanged({ field: 'title', value: 'Ion (ediție)' }),
      fileCopied(),
      opened(),
    );
    expect(typed.form).toMatchObject({
      title: 'Ion (ediție)',
      author: 'Liviu Rebreanu',
    });
    expect(typed.edited).toEqual({ title: true, author: false });
  });

  it('ignores empty or placeholder metadata', () => {
    const anonymous = run(started, fileCopied(), opened('  ', '(anonymous)'));
    expect(anonymous.form).toMatchObject({ title: 'ion-rebreanu', author: '' });
  });

  it('changes the language', () => {
    expect(run(started, languageChanged('en-US')).form.language).toBe('en-US');
  });

  it('submits with a title while running or once ready', () => {
    expect(run(...toExtracting, importSubmitted()).submitted).toBe(true);
    expect(
      run(...toSaving, importFinished(), importSubmitted()).submitted,
    ).toBe(true);
  });

  it('refuses to submit without a title', () => {
    const untitled = run(
      started,
      formChanged({ field: 'title', value: '  ' }),
      importSubmitted(),
    );
    expect(untitled.submitted).toBe(false);
    expect(warn).toHaveBeenCalledWith(
      'import: importSubmitted ignored without a title',
    );
  });
});

describe('importSlice failures, cancel and reset', () => {
  it.each([
    ['copying', [started], 'copy'],
    ['duplicate', [started, duplicateFound(OTHER)], 'copy'],
    ['opening', [started, fileCopied()], 'extract'],
    ['extracting', toExtracting, 'extract'],
    ['splitting', [...toExtracting, extractionFinished()], 'split'],
    ['saving', toSaving, 'save'],
  ] as const)(
    'fails and cancels while %s at the matching step',
    (_phase, before, step) => {
      expect(run(...before, importFailed('password')).phase).toEqual({
        type: 'failed',
        reason: 'password',
        step,
      });
      expect(run(...before, importCancelled()).phase).toEqual({
        type: 'cancelled',
        step,
      });
    },
  );

  it('starts a new import after one ended, forgetting the old one', () => {
    const again = run(
      ...toExtracting,
      chapterSaved(),
      importFailed('timeout'),
      importStarted({ bookId: OTHER, file: FILE }),
    );
    expect(again).toMatchObject({
      phase: { type: 'copying' },
      bookId: OTHER,
      chaptersSaved: 0,
      pageCount: 0,
    });
  });

  it('resets to idle', () => {
    expect(run(...toExtracting, importReset())).toEqual(initialImportState);
  });
});

describe('importSlice invalid transitions', () => {
  it.each([
    ['fileCopied', [], fileCopied()],
    ['duplicateFound', [started, fileCopied()], duplicateFound(OTHER)],
    ['duplicateKept', [started], duplicateKept()],
    ['documentOpened', [started], opened()],
    ['pagesExtracted', [started, fileCopied()], pagesExtracted(3)],
    ['chapterSaved', [started], chapterSaved()],
    ['extractionFinished', [started], extractionFinished()],
    ['savingStarted', toExtracting, savingStarted()],
    ['importFinished', toExtracting, importFinished()],
    ['importFailed', [], importFailed('corrupt')],
    ['importCancelled', [started, importCancelled()], importCancelled()],
    ['importStarted', [started], importStarted({ bookId: OTHER, file: FILE })],
    ['importSubmitted', [], importSubmitted()],
  ] as const)(
    'ignores %s in the wrong phase and logs it',
    (name, before, action) => {
      const state = run(...before);
      expect(importReducer(state, action)).toEqual(state);
      expect(warn).toHaveBeenCalledWith(
        `import: ${name} ignored in phase ${state.phase.type}`,
      );
    },
  );
});
