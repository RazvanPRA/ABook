import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BookScreen } from '@/features/book';
import {
  continueImport,
  importPdf,
  selectImportingBookId,
} from '@/features/import';
import {
  bookRemoved,
  bookUpserted,
  loadLibraryProgress,
  selectBookById,
} from '@/features/library';
import { SOURCE_SIZE, SOURCE_URI } from '@/repositories/__fixtures__/books';
import {
  bookmarksSchema,
  tocSchema,
  type BookId,
  type BookMeta,
  type Progress,
} from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';
import { makeProgress } from '@/shared/domain/__fixtures__/progress';
import { NOW } from '@/shared/domain/__fixtures__/rawValues';
import { fakeApp } from '../__fixtures__/fakeApp';
import { I18nProvider } from '../providers/I18nProvider';
import { StoreProvider } from '../providers/StoreProvider';

const [A, B] = BOOK_IDS as [BookId, BookId];
const TOC = tocSchema.parse(
  [
    ['Partea I', 1, 21],
    ['Partea a II-a', 22, 43],
    ['', 44, 44],
  ].map(([title, startPage, endPage], index) => ({
    index,
    title,
    startPage,
    endPage,
    sentenceCount: 10,
  })),
);
const MARKS = bookmarksSchema.parse(
  [27, 31].map(page => ({
    id: `m${page}`,
    chapter: 1,
    sentence: 5,
    page,
    excerpt: `Fraza ${page}`,
    createdAt: NOW,
  })),
);

interface Given {
  meta?: Partial<BookMeta>;
  progress?: Progress;
  toc?: typeof TOC;
  pdf?: boolean;
}

async function setup({ meta, progress, toc = TOC, pdf = true }: Given = {}) {
  const app = fakeApp();
  const { bookRepository, progressRepository } = app.services;
  app.files.addFile(SOURCE_URI, SOURCE_SIZE);
  const stored = await bookRepository.storePdf(A, SOURCE_URI);
  const book = makeMeta(A, {
    status: 'ready',
    pageCount: 82,
    processedPages: 82,
    fileUri: stored.path,
    ...meta,
  });
  await bookRepository.createBook({ ...book, status: 'processing' });
  await bookRepository.updateMeta(A, book);
  await bookRepository.saveToc(A, toc);
  await progressRepository.saveBookmarks(A, MARKS);
  if (progress) {
    await progressRepository.saveProgress(A, progress);
  }
  if (!pdf) {
    await app.files.remove(stored.path);
  }
  app.store.dispatch(bookUpserted(book));
  await app.store.dispatch(loadLibraryProgress());
  const actions = {
    onBack: jest.fn(),
    onLibrary: jest.fn(),
    onPlay: jest.fn(),
  };
  const element = (bookId: BookId | null = A) => (
    <StoreProvider store={app.store}>
      <I18nProvider>
        <BookScreen bookId={bookId} {...actions} />
      </I18nProvider>
    </StoreProvider>
  );
  return { ...app, ...actions, element, progressRepository };
}

async function show(given?: Given, bookId?: BookId | null) {
  const all = await setup(given);
  const dispatched = jest.spyOn(all.store, 'dispatch');
  const view = await render(all.element(bookId));
  if (bookId === undefined) {
    await screen.findByRole('header', { name: 'Cuprins' });
  }
  const requests = () =>
    dispatched.mock.calls
      .map(([action]) => action as unknown)
      .filter(
        action =>
          typeof action === 'object' &&
          (action as { type?: string }).type === 'playback/requested',
      )
      .map(action => (action as { payload: unknown }).payload);
  return { ...all, view, requests };
}

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const query = (name: string | RegExp) => screen.queryByRole('button', { name });
const press = (name: string | RegExp) => fireEvent.press(button(name));
const flush = () => act(async () => new Promise(r => setTimeout(r, 5)));

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warn.mockRestore();
  jest.useRealTimers();
});

describe('BookScreen: missing and loading', () => {
  it.each([
    ['malformed', null],
    ['unknown', B],
  ])('says a %s book does not exist', async (_case, id) => {
    const { onLibrary } = await show({}, id);
    expect(screen.getByText('Cartea nu mai există')).toBeOnTheScreen();
    await press('Înapoi la bibliotecă');
    expect(onLibrary).toHaveBeenCalledTimes(1);
  });

  it('shows a skeleton until the book is read', async () => {
    const { element, services } = await setup();
    jest
      .spyOn(services.bookRepository, 'getToc')
      .mockReturnValue(new Promise(() => {}));
    await render(element());
    expect(screen.getByLabelText('Se încarcă cartea')).toBeOnTheScreen();
    expect(query('Mai multe opțiuni')).toBeNull();
  });

  it('becomes missing when the book is deleted elsewhere', async () => {
    const { store } = await show();
    await act(async () => {
      store.dispatch(bookRemoved(A));
    });
    expect(screen.getByText('Cartea nu mai există')).toBeOnTheScreen();
  });
});

describe('BookScreen: ready', () => {
  it('shows the title, the author and the metadata', async () => {
    const { onBack } = await show();
    expect(
      screen.getByRole('header', { name: 'Amintiri din copilărie' }),
    ).toBeOnTheScreen();
    for (const text of ['82 de pagini', '1,1 MB', 'Română', 'Offline']) {
      expect(screen.getByText(text)).toBeOnTheScreen();
    }
    expect(screen.queryByTestId('book-banner')).toBeNull();
    await press('Înapoi');
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('starts a book never played', async () => {
    const { requests, onPlay } = await show();
    expect(screen.queryByRole('progressbar')).toBeNull();
    await press('Începe să asculți');
    expect(requests()).toEqual([{ bookId: A }]);
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('continues a started book and marks its chapters', async () => {
    const { requests } = await show({ progress: makeProgress() });
    expect(
      screen.getByRole('progressbar', { name: '41% ascultat' }),
    ).toBeOnTheScreen();
    expect(button('Partea I, paginile 1–21, ascultat')).not.toBeSelected();
    expect(
      button('Partea a II-a, paginile 22–43, în curs de ascultare'),
    ).toBeSelected();
    expect(button('Capitolul 3, pagina 44, neascultat')).toBeOnTheScreen();
    await press('Continuă de la pagina 34');
    expect(requests()).toEqual([{ bookId: A }]);
  });

  it('listens from a chapter and from a bookmark', async () => {
    const { requests, onPlay } = await show();
    await press(/^Partea a II-a/);
    await press('Pagina 27, Fraza 27');
    expect(requests()).toEqual([
      { bookId: A, chapter: 1 },
      { bookId: A, chapter: 1, sentence: 5 },
    ]);
    expect(onPlay).toHaveBeenCalledTimes(2);
  });

  it('cannot play without chapters', async () => {
    await show({ toc: [] });
    expect(button('Începe să asculți')).toBeDisabled();
    expect(screen.getByText('Niciun capitol salvat încă.')).toBeOnTheScreen();
  });
});

describe('BookScreen: listening again', () => {
  const finished = { progress: makeProgress({ finished: true }) };

  it('resets the progress only after the confirmation', async () => {
    const { progressRepository, requests, onPlay } = await show(finished);
    await press('Ascultă din nou');
    expect(await progressRepository.getProgress(A)).not.toBeNull();
    await press('De la început');
    await flush();
    expect(await progressRepository.getProgress(A)).toBeNull();
    expect(requests()).toEqual([{ bookId: A }]);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(button('Începe să asculți')).toBeOnTheScreen();
  });

  it('changes nothing when cancelled', async () => {
    const { progressRepository, requests } = await show(finished);
    await press('Ascultă din nou');
    await fireEvent.press(
      screen.getAllByRole('button', { name: 'Renunță' })[0] as never,
    );
    expect(query('De la început')).toBeNull();
    expect(await progressRepository.getProgress(A)).not.toBeNull();
    expect(requests()).toEqual([]);
  });
});

describe('BookScreen: bookmarks', () => {
  const remove = (page: number) => press(`Șterge semnul de la pagina ${page}`);
  const stored = async (all: Awaited<ReturnType<typeof show>>) =>
    (await all.progressRepository.getBookmarks(A)).map(m => m.page);

  it('hides a removed one at once and writes it after 5 s', async () => {
    const all = await show();
    jest.useFakeTimers();
    await remove(27);
    expect(query('Pagina 27, Fraza 27')).toBeNull();
    expect(screen.getByText('Semn de carte șters')).toBeOnTheScreen();
    await act(async () => jest.advanceTimersByTime(4999));
    expect(await stored(all)).toEqual([27, 31]);
    await act(async () => jest.advanceTimersByTime(1));
    expect(await stored(all)).toEqual([31]);
    expect(screen.queryByText('Semn de carte șters')).toBeNull();
  });

  it('brings it back on "Anulează", writing nothing', async () => {
    const all = await show();
    jest.useFakeTimers();
    await remove(27);
    await press('Anulează');
    expect(button('Pagina 27, Fraza 27')).toBeOnTheScreen();
    await act(async () => jest.advanceTimersByTime(10_000));
    expect(await stored(all)).toEqual([27, 31]);
  });

  it('writes it when the screen is left', async () => {
    const all = await show();
    await remove(27);
    await all.view.unmount();
    await flush();
    expect(await stored(all)).toEqual([31]);
  });

  it('writes the first one when a second is removed', async () => {
    const all = await show();
    await remove(27);
    await remove(31);
    await flush();
    expect(await stored(all)).toEqual([31]);
    expect(screen.queryByRole('header', { name: 'Semne de carte' })).toBeNull();
  });
});

describe('BookScreen: importing', () => {
  const processing = {
    meta: { status: 'processing', processedPages: 21 },
    toc: TOC.slice(0, 1),
  } as const;

  it('offers to continue a stalled import', async () => {
    const { store, extractor } = await show(processing);
    expect(screen.getByText('Import întrerupt')).toBeOnTheScreen();
    expect(
      screen.getByText('Importul s-a oprit la pagina 21 din 82.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Un capitol salvat.')).toBeOnTheScreen();
    expect(button('Începe să asculți')).toBeEnabled();
    extractor.pauseAtPage(1);
    await press('Reia importul');
    await flush();
    expect(selectImportingBookId(store.getState())).toBe(A);
    expect(screen.getByText('Se importă')).toBeOnTheScreen();
    expect(query('Reia importul')).toBeNull();
    await act(async () => extractor.resume());
    await flush();
    await flush();
    expect(selectBookById(store.getState(), A)?.status).toBe('ready');
    expect(screen.queryByTestId('book-banner')).toBeNull();
  });

  it('says when it stopped before the first page', async () => {
    await show({
      meta: { status: 'processing', pageCount: 0, processedPages: 0 },
      toc: [],
    });
    expect(
      screen.getByText('Importul s-a oprit înainte de prima pagină.'),
    ).toBeOnTheScreen();
    expect(button('Începe să asculți')).toBeDisabled();
  });

  it('waits while another book is imported', async () => {
    const { store, extractor } = await show(processing);
    extractor.pauseAtPage(1);
    await act(async () => {
      store.dispatch(
        importPdf({ name: 'b.pdf', uri: SOURCE_URI, sizeBytes: SOURCE_SIZE }),
      );
    });
    await flush();
    expect(button('Reia importul')).toBeDisabled();
  });

  it('shows the live page of the running import', async () => {
    const { store, extractor } = await show(processing);
    extractor.pauseAtPage(26);
    await act(async () => {
      store.dispatch(continueImport(A));
    });
    await flush();
    expect(screen.getByText(/^Pagina \d+ din 30\.$/)).toBeOnTheScreen();
    expect(
      screen.getByRole('progressbar', { name: 'Progres import' }),
    ).toBeOnTheScreen();
  });
});

describe('BookScreen: failed', () => {
  it.each([
    ['scanned', 'PDF-ul pare scanat: paginile lui nu conțin text.'],
    ['password', 'PDF-ul este protejat cu parolă.'],
    ['corrupt', 'Fișierul este deteriorat sau nu este un PDF.'],
    ['missing-file', 'Fișierul PDF nu mai este pe dispozitiv.'],
  ] as const)('explains %s, without a retry', async (failure, text) => {
    await show({ meta: { status: 'failed', failure } });
    expect(screen.getByText(text)).toBeOnTheScreen();
    expect(
      screen.getByText('Capitolele salvate pot fi ascultate.'),
    ).toBeOnTheScreen();
    expect(query('Reîncearcă')).toBeNull();
    expect(button('Începe să asculți')).toBeEnabled();
    expect(button('Șterge de pe dispozitiv')).toBeOnTheScreen();
  });

  it('retries an unknown reason', async () => {
    const { store, extractor } = await show({ meta: { status: 'failed' } });
    extractor.pauseAtPage(1);
    await press('Reîncearcă');
    await flush();
    expect(selectBookById(store.getState(), A)?.status).toBe('processing');
  });

  it('does not retry without the PDF', async () => {
    await show({ meta: { status: 'failed' }, pdf: false });
    expect(query('Reîncearcă')).toBeNull();
  });
});

describe('BookScreen: delete', () => {
  it('asks first, then deletes and leads to the library', async () => {
    const { store, onLibrary, files } = await show();
    await press('Mai multe opțiuni');
    await fireEvent.press(
      screen.getByRole('menuitem', { name: 'Șterge de pe dispozitiv' }),
    );
    expect(
      screen.getByRole('header', { name: 'Ștergi „Amintiri din copilărie”?' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Se eliberează 1,1 MB.')).toBeOnTheScreen();
    expect(screen.queryByText('Importul în curs se oprește.')).toBeNull();
    expect(selectBookById(store.getState(), A)).not.toBeNull();
    await press('Șterge');
    await flush();
    expect(selectBookById(store.getState(), A)).toBeNull();
    expect(files.filePaths()).toEqual([SOURCE_URI]);
    expect(onLibrary).toHaveBeenCalledTimes(1);
  });

  it('keeps the book when cancelled', async () => {
    const { store, onLibrary } = await show();
    await press('Șterge de pe dispozitiv');
    await fireEvent.press(
      screen.getAllByRole('button', { name: 'Renunță' })[0] as never,
    );
    expect(query('Șterge')).toBeNull();
    expect(selectBookById(store.getState(), A)).not.toBeNull();
    expect(onLibrary).not.toHaveBeenCalled();
  });

  it('shows a failed delete and tries again', async () => {
    const { services, onLibrary } = await show();
    jest
      .spyOn(services.bookRepository, 'deleteBook')
      .mockRejectedValueOnce(new Error('disk'))
      .mockRejectedValueOnce(new Error('disk'));
    await press('Șterge de pe dispozitiv');
    await press('Șterge');
    await flush();
    expect(screen.getByText('Cartea nu a putut fi ștearsă')).toBeOnTheScreen();
    expect(onLibrary).not.toHaveBeenCalled();
    await press('Încearcă din nou');
    await flush();
    expect(onLibrary).toHaveBeenCalledTimes(1);
  });

  it('does not navigate when the user left meanwhile', async () => {
    const { services, onLibrary, view } = await show();
    let finish = () => {};
    jest.spyOn(services.bookRepository, 'deleteBook').mockImplementation(
      () =>
        new Promise(resolve => {
          finish = () => resolve();
        }),
    );
    await press('Șterge de pe dispozitiv');
    await press('Șterge');
    expect(screen.getByLabelText('Se încarcă cartea')).toBeOnTheScreen();
    await view.unmount();
    finish();
    await flush();
    expect(onLibrary).not.toHaveBeenCalled();
  });
});
