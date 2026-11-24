import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { BOOK_IDS } from '@/shared/domain/__fixtures__/books';
import type { BookId } from '@/shared/domain';
import { libraryHydrated } from '@/features/library';
import { makeMeta } from '@/shared/domain/__fixtures__/books';
import { logger } from '@/shared/utils';
import { PICKED, book } from '../../__fixtures__/importSetup';
import {
  createScreenStore,
  renderImportScreen,
} from '../../__fixtures__/renderImportScreen';
import {
  documentOpened,
  duplicateFound,
  fileCopied,
  importCancelled,
  importFailed,
  importFinished,
  importResumed,
  importStarted,
  importSubmitted,
  pagesExtracted,
} from '../../state/importSlice';
import type { ImportFailure } from '../../model/types';

const [BOOK, OTHER] = BOOK_IDS as [BookId, BookId];
const STORED = { path: '/files/books/x.pdf', sizeBytes: 10, fingerprint: 'f' };

const button = (name: string) => screen.getByRole('button', { name });

/** A store already at page 186 of 412, as in the mockup. */
function extracting() {
  const setup = createScreenStore();
  const { dispatch } = setup.store;
  dispatch(importStarted({ bookId: BOOK, file: PICKED }));
  dispatch(fileCopied(STORED));
  dispatch(
    documentOpened({ pageCount: 412, title: 'Ion', author: 'Liviu Rebreanu' }),
  );
  dispatch(pagesExtracted(186));
  return setup;
}

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('ImportScreen before a file is picked', () => {
  it('offers the picker and nothing else', async () => {
    await renderImportScreen();
    expect(
      screen.getByRole('header', { name: 'Importă PDF' }),
    ).toBeOnTheScreen();
    expect(button('Alege PDF')).toBeOnTheScreen();
    expect(screen.queryByText('Procesare locală')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Adaugă în bibliotecă' }),
    ).toBeNull();
  });

  it('imports the picked PDF up to ready, with the form prefilled', async () => {
    const setup = createScreenStore({
      pages: book(12),
      title: 'Ion',
      author: 'Liviu Rebreanu',
    });
    setup.picker.next(PICKED);
    await renderImportScreen(setup);
    await fireEvent.press(button('Alege PDF'));
    await waitFor(() =>
      expect(setup.store.getState().import.phase).toEqual({ type: 'ready' }),
    );
    expect(screen.getByText('ion-rebreanu.pdf')).toBeOnTheScreen();
    expect(screen.getByText('3,6 MB · 12 pagini')).toBeOnTheScreen();
    expect(screen.getByLabelText('Titlu').props.value).toBe('Ion');
    expect(screen.getByLabelText('Autor').props.value).toBe('Liviu Rebreanu');
    expect(button('Adaugă în bibliotecă')).toBeEnabled();
  });

  it('stays as it is when the picker is closed', async () => {
    const setup = createScreenStore();
    setup.picker.next(null);
    await renderImportScreen(setup);
    await fireEvent.press(button('Alege PDF'));
    expect(button('Alege PDF')).toBeOnTheScreen();
  });
});

describe('ImportScreen while importing', () => {
  it('shows the steps as in the mockup, the extract step with its pages', async () => {
    await renderImportScreen(extracting());
    expect(screen.getByText('3,6 MB · 412 pagini')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Fișier copiat în aplicație, gata'),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Extragere text, în curs, pagina 186 din 412'),
    ).toBeOnTheScreen();
    expect(screen.getByText('pagina 186 / 412')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Împărțire în capitole și fraze, în așteptare'),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Salvare în AsyncStorage, în așteptare'),
    ).toBeOnTheScreen();
  });

  it('submits the form and closes; the import goes on', async () => {
    const { onClose, store } = await renderImportScreen(extracting());
    await fireEvent.changeText(screen.getByLabelText('Autor'), 'L. Rebreanu');
    await fireEvent.press(button('Adaugă în bibliotecă'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(store.getState().import).toMatchObject({
      submitted: true,
      form: { author: 'L. Rebreanu' },
      phase: { type: 'extracting' },
    });
  });

  it('offers no voice language: books are read in English', async () => {
    await renderImportScreen(extracting());
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('cannot be submitted without a title, and says why', async () => {
    await renderImportScreen(extracting());
    await fireEvent.changeText(screen.getByLabelText('Titlu'), ' ');
    expect(
      screen.getByText('Cartea are nevoie de un titlu.'),
    ).toBeOnTheScreen();
    expect(button('Adaugă în bibliotecă')).toBeDisabled();
  });

  it('cancels the import', async () => {
    const { store } = await renderImportScreen(extracting());
    await fireEvent.press(button('Anulează importul'));
    expect(store.getState().import.phase).toEqual({
      type: 'cancelled',
      step: 'extract',
    });
    expect(screen.getByText('Import anulat')).toBeOnTheScreen();
    expect(
      screen.getByText('Nu a rămas nimic salvat pe telefon.'),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText('Titlu')).toBeNull();
  });

  it('does not close on opening when the import was submitted before', async () => {
    const setup = extracting();
    setup.store.dispatch(importSubmitted());
    const { onClose } = await renderImportScreen(setup);
    expect(onClose).not.toHaveBeenCalled();
    expect(button('Adaugă în bibliotecă')).toBeDisabled();
  });
});

describe('ImportScreen when the import stopped', () => {
  it.each([
    ['scanned', 'PDF scanat', 'PDF-ul pare scanat'],
    ['password', 'Importul nu a reușit', 'protejat cu parolă'],
    ['corrupt', 'Importul nu a reușit', 'deteriorat sau nu este un PDF'],
    ['too-large', 'Importul nu a reușit', 'peste 100 MB'],
  ] as const)(
    'explains a %s failure, says nothing was left, offers another PDF',
    async (reason, title, text) => {
      const setup = extracting();
      setup.store.dispatch(importFailed(reason as ImportFailure));
      await renderImportScreen(setup);
      expect(screen.getByRole('header', { name: title })).toBeOnTheScreen();
      expect(screen.getByText(new RegExp(text))).toBeOnTheScreen();
      expect(
        screen.getByText('Nu a rămas nimic salvat pe telefon.'),
      ).toBeOnTheScreen();
      expect(screen.getByLabelText(/Extragere text, eroare/)).toBeOnTheScreen();
      expect(button('Alege alt PDF')).toBeOnTheScreen();
      expect(screen.queryByLabelText('Titlu')).toBeNull();
    },
  );

  it('asks what to do with a duplicate, naming the book already there', async () => {
    const setup = createScreenStore();
    const { dispatch } = setup.store;
    dispatch(
      libraryHydrated([makeMeta(OTHER, { title: 'Ion', status: 'ready' })]),
    );
    dispatch(importStarted({ bookId: BOOK, file: PICKED }));
    dispatch(duplicateFound({ existingBookId: OTHER, stored: STORED }));
    await renderImportScreen(setup);
    expect(screen.getByText('Cartea e deja în bibliotecă')).toBeOnTheScreen();
    expect(screen.getByText('„Ion” are același fișier.')).toBeOnTheScreen();
    expect(button('Importă încă o dată')).toBeOnTheScreen();
    await fireEvent.press(button('Renunță'));
    expect(setup.store.getState().import.phase).toEqual({
      type: 'cancelled',
      step: 'copy',
    });
  });

  it('a resumed import can be submitted, and its failure says the chapters are kept', async () => {
    const setup = createScreenStore();
    const { dispatch } = setup.store;
    const form = { title: 'Ion', author: '' };
    dispatch(
      importResumed({
        bookId: BOOK,
        file: PICKED,
        form,
        chaptersSaved: 2,
        metadataRead: true,
      }),
    );
    await renderImportScreen(setup);
    expect(button('Adaugă în bibliotecă')).toBeEnabled();
    await act(async () => {
      dispatch(importFailed('timeout'));
    });
    expect(
      screen.getByText('Capitolele salvate până acum au rămas în bibliotecă.'),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/Nu a rămas nimic/)).toBeNull();
  });

  it('clears a finished import when it opens again', async () => {
    const setup = extracting();
    setup.store.dispatch(importCancelled());
    await renderImportScreen(setup);
    expect(button('Alege PDF')).toBeOnTheScreen();
  });

  it('opens on a fresh pick after a ready import', async () => {
    const setup = createScreenStore();
    const { dispatch } = setup.store;
    dispatch(importStarted({ bookId: BOOK, file: PICKED }));
    dispatch(fileCopied(STORED));
    dispatch(documentOpened({ pageCount: 3, title: null, author: null }));
    dispatch({ type: 'import/extractionFinished' });
    dispatch({ type: 'import/savingStarted' });
    dispatch(importFinished());
    await renderImportScreen(setup);
    expect(setup.store.getState().import.phase).toEqual({ type: 'idle' });
  });
});
