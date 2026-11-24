import { renderHook, waitFor } from '@testing-library/react-native';
import {
  selectBookProgress,
  selectBooksInOrder,
  selectProgressLoaded,
} from '@/features/library';
import { selectSettings } from '@/features/settings';
import { DEFAULT_SETTINGS, type BookId } from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/repositories/__fixtures__/books';
import { makeProgress } from '@/shared/domain/__fixtures__/progress';
import { fakeServices } from '../__fixtures__/fakeServices';
import { featureDependencies } from '../dependencies';
import { createAppStore } from '../store';
import { useBootstrap } from '../useBootstrap';

const [A, B] = BOOK_IDS as [BookId, BookId];

describe('useBootstrap', () => {
  it('hydrates the store with the stored library and settings, then reports ready', async () => {
    const { services } = fakeServices();
    await services.bookRepository.createBook(makeMeta(A));
    await services.bookRepository.createBook(makeMeta(B));
    const settings = { ...DEFAULT_SETTINGS, fontScale: 2 as const };
    await services.settingsRepository.saveSettings(settings);
    const store = createAppStore(featureDependencies(services));

    const { result } = await renderHook(() =>
      useBootstrap(services.bootRepository, store.dispatch),
    );
    await waitFor(() => expect(result.current).toBe(true));

    const books = selectBooksInOrder(store.getState());
    expect(books.map(b => [b.id, b.status])).toEqual([
      [B, 'failed'], // left processing: interrupted import
      [A, 'failed'],
    ]);
    expect(selectSettings(store.getState())).toEqual(settings);
  });

  it('reads every progress after hydration, in one read', async () => {
    const { services } = fakeServices();
    await services.bookRepository.createBook(makeMeta(A));
    await services.progressRepository.saveProgress(A, makeProgress());
    const list = jest.spyOn(services.progressRepository, 'listProgress');
    const store = createAppStore(featureDependencies(services));
    await renderHook(() =>
      useBootstrap(services.bootRepository, store.dispatch),
    );
    await waitFor(() =>
      expect(selectProgressLoaded(store.getState())).toBe(true),
    );
    expect(list).toHaveBeenCalledTimes(1);
    expect(selectBookProgress(store.getState(), A)).toEqual(makeProgress());
  });

  it('runs bootstrap only once across re-renders', async () => {
    const { services } = fakeServices();
    const migrate = jest.spyOn(services.bootRepository, 'migrate');
    const store = createAppStore(featureDependencies(services));
    const { result, rerender } = await renderHook(() =>
      useBootstrap(services.bootRepository, store.dispatch),
    );
    await rerender({});
    await waitFor(() => expect(result.current).toBe(true));
    expect(migrate).toHaveBeenCalledTimes(1);
  });
});
