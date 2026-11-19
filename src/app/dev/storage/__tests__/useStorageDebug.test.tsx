import React, { type PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { fakeServices } from '../../../__fixtures__/fakeServices';
import { featureDependencies } from '../../../dependencies';
import { ServicesProvider } from '../../../providers/ServicesProvider';
import { StoreProvider } from '../../../providers/StoreProvider';
import { createAppStore } from '../../../store';
import { seedSourcePath } from '../seedSampleBook';
import { useStorageDebug } from '../useStorageDebug';

const setup = async () => {
  const fakes = fakeServices();
  const { files } = fakes;
  files.addFile(seedSourcePath(files.booksDir()), 4096);
  const store = createAppStore(featureDependencies(fakes.services));
  const wrapper = ({ children }: PropsWithChildren) => (
    <StoreProvider store={store}>
      <ServicesProvider services={fakes.services}>{children}</ServicesProvider>
    </StoreProvider>
  );
  const hook = await renderHook(() => useStorageDebug(), { wrapper });
  return { ...fakes, store, hook };
};

describe('useStorageDebug', () => {
  it('seeds a processing book with a split chapter and its PDF, visible in the store', async () => {
    const { hook, files } = await setup();
    await act(() => hook.result.current.seed());

    const [book] = hook.result.current.books;
    if (book === undefined) {
      throw new Error('seed did not reach the store');
    }
    expect(book.status).toBe('processing');
    await waitFor(() =>
      expect(hook.result.current.stats?.chapterOne[book.id]).toBe(6000),
    );
    const stats = hook.result.current.stats;
    expect(stats?.files).toEqual([`${book.id}.pdf`]);
    expect(stats?.bookKeyCount).toBeGreaterThan(3); // meta, ch:0, ch:1 manifest + parts
    expect(await files.size(files.bookPdfPath(book.id))).toBe(4096);
  });

  it('deletes every book, leaving no book key and no file', async () => {
    const { hook } = await setup();
    await act(() => hook.result.current.seed());
    await act(() => hook.result.current.seed());
    await waitFor(() => expect(hook.result.current.books).toHaveLength(2));

    await act(() => hook.result.current.deleteAll());
    await waitFor(() =>
      expect(hook.result.current.stats?.bookKeyCount).toBe(0),
    );
    expect(hook.result.current.books).toEqual([]);
    expect(hook.result.current.stats?.files).toEqual([]);
  });
});
