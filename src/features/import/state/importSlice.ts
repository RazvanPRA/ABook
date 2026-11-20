import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { StoredPdf } from '@/repositories';
import type { BookId, BookLanguage } from '@/shared/domain';
import { logger } from '@/shared/utils';
import { titleFromFileName, usableMetadata } from '../model/metadata';
import { ACTIVE_PHASES, isActivePhase, stepOfPhase } from '../model/steps';
import type {
  ImportFailure,
  ImportForm,
  ImportFormField,
  ImportPhase,
  ImportPhaseType,
  PickedFile,
} from '../model/types';

export interface ImportState {
  readonly phase: ImportPhase;
  readonly bookId: BookId | null;
  readonly file: PickedFile | null;
  /** The app's copy of the file, once copied: a kept duplicate continues from it. */
  readonly stored: StoredPdf | null;
  readonly pageCount: number;
  /** Chapters already in storage: the book is playable from the first one. */
  readonly chaptersSaved: number;
  readonly form: ImportForm;
  /** Fields the user typed in, which PDF metadata must not overwrite. */
  readonly edited: Readonly<Record<ImportFormField, boolean>>;
  /** "Adaugă în bibliotecă" was pressed: the form is saved into the book's meta. */
  readonly submitted: boolean;
}

export const DEFAULT_IMPORT_LANGUAGE: BookLanguage = 'ro-RO';

export const initialImportState: ImportState = {
  phase: { type: 'idle' },
  bookId: null,
  file: null,
  stored: null,
  pageCount: 0,
  chaptersSaved: 0,
  form: { title: '', author: '', language: DEFAULT_IMPORT_LANGUAGE },
  edited: { title: false, author: false },
  submitted: false,
};

const FINISHED: readonly ImportPhaseType[] = [
  'idle',
  'ready',
  'failed',
  'cancelled',
];

/** Whether `action` may run in the current phase; an invalid transition is ignored and logged. */
function allowed(
  state: ImportState,
  action: string,
  from: readonly ImportPhaseType[],
): boolean {
  if (from.includes(state.phase.type)) {
    return true;
  }
  logger.warn(`import: ${action} ignored in phase ${state.phase.type}`);
  return false;
}

/** Fills a form field from PDF metadata unless the user already typed in it. */
function prefill(
  state: ImportState,
  field: ImportFormField,
  value: string | null,
) {
  const text = usableMetadata(value);
  return text === null || state.edited[field] ? state.form[field] : text;
}

const importSlice = createSlice({
  name: 'import',
  initialState: initialImportState,
  reducers: {
    /** A file was picked: a new import starts, whatever the previous one ended in. */
    importStarted: (
      state,
      action: PayloadAction<{ bookId: BookId; file: PickedFile }>,
    ) => {
      if (!allowed(state, 'importStarted', FINISHED)) {
        return state;
      }
      const { bookId, file } = action.payload;
      return {
        ...initialImportState,
        phase: { type: 'copying' },
        bookId,
        file,
        form: {
          ...initialImportState.form,
          title: titleFromFileName(file.name),
        },
      };
    },
    fileCopied: (state, action: PayloadAction<StoredPdf>) => {
      if (allowed(state, 'fileCopied', ['copying'])) {
        state.stored = action.payload;
        state.phase = { type: 'opening' };
      }
    },
    /** The copy has the fingerprint of a book in the library: the user decides. */
    duplicateFound: (
      state,
      action: PayloadAction<{ existingBookId: BookId; stored: StoredPdf }>,
    ) => {
      if (allowed(state, 'duplicateFound', ['copying'])) {
        const { existingBookId, stored } = action.payload;
        state.stored = stored;
        state.phase = { type: 'duplicate', existingBookId };
      }
    },
    /** The user keeps a second copy of a book already in the library. */
    duplicateKept: state => {
      if (allowed(state, 'duplicateKept', ['duplicate'])) {
        state.phase = { type: 'opening' };
      }
    },
    documentOpened: (
      state,
      action: PayloadAction<{
        pageCount: number;
        title: string | null;
        author: string | null;
      }>,
    ) => {
      if (!allowed(state, 'documentOpened', ['opening'])) {
        return;
      }
      const { pageCount, title, author } = action.payload;
      state.pageCount = pageCount;
      state.phase = { type: 'extracting', page: 0, total: pageCount };
      state.form.title = prefill(state, 'title', title);
      state.form.author = prefill(state, 'author', author);
    },
    /** Pages 1…`page` are extracted; progress never goes back nor past the last page. */
    pagesExtracted: (state, action: PayloadAction<number>) => {
      const { phase } = state;
      if (
        allowed(state, 'pagesExtracted', ['extracting']) &&
        phase.type === 'extracting'
      ) {
        const page = Math.min(
          Math.max(phase.page, action.payload),
          phase.total,
        );
        state.phase = { ...phase, page };
      }
    },
    chapterSaved: state => {
      if (
        allowed(state, 'chapterSaved', ['extracting', 'splitting', 'saving'])
      ) {
        state.chaptersSaved += 1;
      }
    },
    extractionFinished: state => {
      if (allowed(state, 'extractionFinished', ['extracting'])) {
        state.phase = { type: 'splitting' };
      }
    },
    savingStarted: state => {
      if (allowed(state, 'savingStarted', ['splitting'])) {
        state.phase = { type: 'saving' };
      }
    },
    importFinished: state => {
      if (allowed(state, 'importFinished', ['saving'])) {
        state.phase = { type: 'ready' };
      }
    },
    importFailed: (state, action: PayloadAction<ImportFailure>) => {
      const { phase } = state;
      if (
        allowed(state, 'importFailed', ACTIVE_PHASES) &&
        isActivePhase(phase)
      ) {
        state.phase = {
          type: 'failed',
          reason: action.payload,
          step: stepOfPhase(phase),
        };
      }
    },
    importCancelled: state => {
      const { phase } = state;
      if (
        allowed(state, 'importCancelled', ACTIVE_PHASES) &&
        isActivePhase(phase)
      ) {
        state.phase = { type: 'cancelled', step: stepOfPhase(phase) };
      }
    },
    formChanged: (
      state,
      action: PayloadAction<{ field: ImportFormField; value: string }>,
    ) => {
      const { field, value } = action.payload;
      state.form[field] = value;
      state.edited[field] = true;
    },
    languageChanged: (state, action: PayloadAction<BookLanguage>) => {
      state.form.language = action.payload;
    },
    /** "Adaugă în bibliotecă": only while the import runs or after it ended well, with a title. */
    importSubmitted: state => {
      const running = allowed(state, 'importSubmitted', [
        ...ACTIVE_PHASES,
        'ready',
      ]);
      if (running && state.form.title.trim() !== '') {
        state.submitted = true;
      } else if (running) {
        logger.warn('import: importSubmitted ignored without a title');
      }
    },
    importReset: () => initialImportState,
  },
});

export const {
  importStarted,
  fileCopied,
  duplicateFound,
  duplicateKept,
  documentOpened,
  pagesExtracted,
  chapterSaved,
  extractionFinished,
  savingStarted,
  importFinished,
  importFailed,
  importCancelled,
  formChanged,
  languageChanged,
  importSubmitted,
  importReset,
} = importSlice.actions;

export const importReducer = importSlice.reducer;
