import React, { type PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { libraryHydrated } from '@/features/library';
import {
  BOOK_IDS,
  SOURCE_SIZE,
  SOURCE_URI,
  makeChunk,
  makeMeta,
} from '@/repositories/__fixtures__/books';
import { toChapterIndex, type BookId } from '@/shared/domain';
import { fakeServices } from '../../../__fixtures__/fakeServices';
import { featureDependencies } from '../../../dependencies';
import { ServicesProvider } from '../../../providers/ServicesProvider';
import { StoreProvider } from '../../../providers/StoreProvider';
import { createAppStore } from '../../../store';
import { useStorageDebug } from '../useStorageDebug';

const [A, B] = BOOK_IDS as [BookId, BookId];
const SENTENCES = 6000; // large enough to be split into parts

/** The inspector over books stored through the real repositories. */
const setup = async (ids: readonly BookId[]) => {
  const fakes = fakeServices();
  const { bookRepository } = fakes.services;
  fakes.files.addFile(SOURCE_URI, SOURCE_SIZE);
  for (const id of ids) {
    await bookRepository.storePdf(id, SOURCE_URI);
    await bookRepository.createBook(makeMeta(id));
    await bookRepository.saveChapter(
      id,
      toChapterIndex(1),
      makeChunk(SENTENCES),
    );
  }
  const store = createAppStore(featureDependencies(fakes.services));
  store.dispatch(libraryHydrated(await bookRepository.listBooks()));
  const wrapper = ({ children }: PropsWithChildren) => (
    <StoreProvider store={store}>
      <ServicesProvider services={fakes.services}>{children}</ServicesProvider>
    </StoreProvider>
  );
  return renderHook(() => useStorageDebug(), { wrapper });
};

describe('useStorageDebug', () => {
  it('shows what is stored of a book: split chapter, keys and PDF', async () => {
    const hook = await setup([A]);
    expect(hook.result.current.books.map(book => book.id)).toEqual([A]);
    await waitFor(() =>
      expect(hook.result.current.stats?.chapterOne[A]).toBe(SENTENCES),
    );
    const { stats } = hook.result.current;
    expect(stats?.files).toEqual([`${A}.pdf`]);
    expect(stats?.bookKeyCount).toBeGreaterThan(3); // meta, ch:1 manifest + parts
  });

  it('deletes every book, leaving no book key and no file', async () => {
    const hook = await setup([A, B]);
    expect(hook.result.current.books).toHaveLength(2);
    await act(() => hook.result.current.deleteAll());
    await waitFor(() =>
      expect(hook.result.current.stats?.bookKeyCount).toBe(0),
    );
    expect(hook.result.current.books).toEqual([]);
    expect(hook.result.current.stats?.files).toEqual([]);
  });
});
