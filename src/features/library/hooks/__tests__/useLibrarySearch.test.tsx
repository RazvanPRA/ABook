import React, { type PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import type { BookId } from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';
import { createLibraryStore } from '../../__fixtures__/libraryStore';
import {
  filterChanged,
  queryChanged,
  selectVisibleBooks,
} from '../../state/filterSlice';
import { SEARCH_DEBOUNCE_MS, useLibrarySearch } from '../useLibrarySearch';

const [A, B] = BOOK_IDS as [BookId, BookId];

const libraryOfTwo = () =>
  createLibraryStore([
    makeMeta(A, { title: 'Ion' }),
    makeMeta(B, { title: 'Baltagul' }),
  ]);

async function setup() {
  const { store } = libraryOfTwo();
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const hook = await renderHook(() => useLibrarySearch(), { wrapper });
  const query = () => store.getState().libraryFilter.query;
  const wait = (ms: number) => act(async () => jest.advanceTimersByTime(ms));
  return { store, hook, query, wait };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useLibrarySearch', () => {
  it('shows each key at once and searches 200 ms after the last one', async () => {
    const { hook, query, wait } = await setup();
    await act(async () => hook.result.current.change('I'));
    await wait(SEARCH_DEBOUNCE_MS - 1);
    await act(async () => hook.result.current.change('Io'));
    expect(hook.result.current.text).toBe('Io');
    await wait(SEARCH_DEBOUNCE_MS - 1);
    expect(query()).toBe('');
    await wait(1);
    expect(query()).toBe('Io');
  });

  it('empties at once, dropping what was waiting', async () => {
    const { hook, query, wait } = await setup();
    await act(async () => hook.result.current.change('Ion'));
    await wait(SEARCH_DEBOUNCE_MS);
    await act(async () => hook.result.current.change('Ion c'));
    await act(async () => hook.result.current.change(''));
    expect(query()).toBe('');
    await wait(SEARCH_DEBOUNCE_MS);
    expect(query()).toBe('');
  });

  it('shows a query cleared elsewhere', async () => {
    const { store, hook, wait } = await setup();
    await act(async () => hook.result.current.change('Ion'));
    await wait(SEARCH_DEBOUNCE_MS);
    await act(async () => store.dispatch(queryChanged('')));
    expect(hook.result.current.text).toBe('');
  });

  it('searches nothing after the screen is gone', async () => {
    const { hook, query, wait } = await setup();
    await act(async () => hook.result.current.change('Ion'));
    await hook.unmount();
    await wait(SEARCH_DEBOUNCE_MS);
    expect(query()).toBe('');
  });
});

describe('selectVisibleBooks', () => {
  it('applies the query and the filter, memoized', () => {
    const { store } = libraryOfTwo();
    const all = selectVisibleBooks(store.getState());
    expect(all).toHaveLength(2);
    expect(selectVisibleBooks(store.getState())).toBe(all);
    store.dispatch(queryChanged('balt'));
    expect(selectVisibleBooks(store.getState()).map(i => i.book.id)).toEqual([
      B,
    ]);
    store.dispatch(filterChanged('finished'));
    expect(selectVisibleBooks(store.getState())).toEqual([]);
  });
});
