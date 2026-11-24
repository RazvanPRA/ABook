import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import type { ProgressByBook } from '@/repositories';
import { toBookId, type BookId, type BookMeta } from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';
import { makeProgress } from '@/shared/domain/__fixtures__/progress';
import { i18n } from '@/shared/i18n';
import { createLibraryStore } from '../../__fixtures__/libraryStore';
import { bookRemoved } from '../../state/booksSlice';
import { loadLibraryProgress } from '../../state/thunks';
import { LibraryScreen } from '../LibraryScreen';

const [A, B, C] = BOOK_IDS as [BookId, BookId, BookId];
const ready = (id: BookId, overrides: Partial<BookMeta> = {}) =>
  makeMeta(id, {
    status: 'ready',
    pageCount: 82,
    processedPages: 82,
    ...overrides,
  });

async function show(
  books: readonly BookMeta[],
  stored: ProgressByBook = {},
  { loaded = true } = {},
) {
  const { store } = createLibraryStore(books, stored);
  if (loaded) {
    await store.dispatch(loadLibraryProgress());
  }
  const actions = {
    onImport: jest.fn(),
    onSettings: jest.fn(),
    onOpenBook: jest.fn(),
    onPlay: jest.fn(),
  };
  const dispatched = jest.spyOn(store, 'dispatch');
  await render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <LibraryScreen {...actions} />
      </I18nextProvider>
    </Provider>,
  );
  return { store, dispatched, ...actions };
}

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const row = (name: RegExp) => screen.queryByRole('button', { name });

describe('LibraryScreen', () => {
  it('shows a skeleton until the progress is read', async () => {
    await show([ready(A)], {}, { loaded: false });
    expect(screen.getByLabelText('Se încarcă biblioteca')).toBeOnTheScreen();
    expect(screen.queryByTestId('book-list')).toBeNull();
  });

  it('is empty as in the mockup: no settings button, search nor FAB', async () => {
    const { onImport } = await show([]);
    expect(
      screen.getByRole('header', { name: 'Încă nu ai nicio carte' }),
    ).toBeOnTheScreen();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByLabelText('Caută titlu sau autor')).toBeNull();
    await fireEvent.press(button('Importă primul PDF'));
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it('lists a started book as one element and opens it', async () => {
    const { onOpenBook } = await show([ready(A)], { [A]: makeProgress() });
    await fireEvent.press(
      button('Amintiri din copilărie, Ion Creangă, 41% ascultat'),
    );
    expect(onOpenBook).toHaveBeenCalledWith(A);
  });

  it.each([
    ['never played', ready(A), {}, /, Neînceput$/],
    [
      'finished',
      ready(A),
      { [A]: makeProgress({ finished: true }) },
      /, Terminat$/,
    ],
    [
      'being imported',
      makeMeta(A, { pageCount: 82, processedPages: 20 }),
      {},
      /, Se importă, pagina 20 din 82$/,
    ],
    ['not opened yet', makeMeta(A, { pageCount: 0 }), {}, /, Se pregătește$/],
    ['failed', ready(A, { status: 'failed' }), {}, /, Import eșuat$/],
    ['without an author', ready(A, { author: '' }), {}, /, Autor necunoscut, /],
  ])('shows a book %s', async (_case, book, stored, label) => {
    await show([book], stored);
    expect(row(label)).toBeOnTheScreen();
  });

  it('opens the settings and the import', async () => {
    const { onSettings, onImport } = await show([ready(A)]);
    await fireEvent.press(button('Setări'));
    await fireEvent.press(button('Importă PDF'));
    expect(onSettings).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it('offers to continue the last played, unfinished book', async () => {
    const { onPlay, dispatched } = await show(
      [ready(A), ready(B, { title: 'Baltagul' })],
      {
        [A]: makeProgress({ updatedAt: '2026-11-01T00:00:00.000Z' }),
        [B]: makeProgress({ updatedAt: '2026-11-02T00:00:00.000Z' }),
      },
    );
    expect(screen.getByTestId('continue-card')).toBeOnTheScreen();
    expect(screen.getByText('Pagina 34 · 41% ascultat')).toBeOnTheScreen();
    await fireEvent.press(button('Continuă să asculți Baltagul'));
    expect(dispatched).toHaveBeenCalledWith({
      type: 'playback/requested',
      payload: { bookId: B },
    });
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('has no continue card without a started, unfinished book', async () => {
    await show([ready(A), ready(B)], {
      [B]: makeProgress({ finished: true }),
    });
    expect(screen.queryByTestId('continue-card')).toBeNull();
  });

  it('filters, and says when a filter is empty', async () => {
    await show([ready(A), ready(B, { title: 'Baltagul' })], {
      [A]: makeProgress(),
    });
    await fireEvent.press(screen.getByRole('radio', { name: 'În curs' }));
    expect(row(/^Amintiri/)).toBeOnTheScreen();
    expect(row(/^Baltagul/)).toBeNull();
    await fireEvent.press(screen.getByRole('radio', { name: 'Terminate' }));
    expect(
      screen.getByText('Nu ai terminat încă nicio carte.'),
    ).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Șterge căutarea' }),
    ).toBeNull();
  });

  it('searches, and clears a search without results', async () => {
    jest.useFakeTimers();
    await show([ready(A), ready(B, { title: 'Baltagul' })]);
    const field = screen.getByLabelText('Caută titlu sau autor');
    await fireEvent.changeText(field, 'zzz');
    await act(async () => jest.advanceTimersByTime(200));
    expect(
      screen.getByText('Nicio carte nu se potrivește cu „zzz”.'),
    ).toBeOnTheScreen();
    // The field's own "×" and the message's button share the name
    const clear = screen.getAllByRole('button', { name: 'Șterge căutarea' });
    expect(clear).toHaveLength(2);
    await fireEvent.press(clear[1] as (typeof clear)[number]);
    expect(row(/^Baltagul/)).toBeOnTheScreen();
    expect(field.props.value).toBe('');
    jest.useRealTimers();
  });

  it('renders a window of 200 books, not all of them', async () => {
    const books = Array.from({ length: 200 }, (_, i) =>
      ready(
        toBookId(`00000000-0000-4000-8000-${String(i).padStart(12, '0')}`),
        { title: `Cartea ${i + 1}` },
      ),
    );
    await show(books);
    const rows = screen.getAllByRole('button', { name: /^Cartea / });
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.length).toBeLessThan(60);
  });

  it('becomes empty when the last book is deleted', async () => {
    const { store } = await show([ready(C)]);
    await act(async () => store.dispatch(bookRemoved(C)));
    expect(screen.getByText('Încă nu ai nicio carte')).toBeOnTheScreen();
  });
});
