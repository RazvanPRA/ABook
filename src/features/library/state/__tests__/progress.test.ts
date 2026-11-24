import type { BookId } from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';
import { makeProgress } from '@/shared/domain/__fixtures__/progress';
import { logger } from '@/shared/utils';
import { createLibraryStore } from '../../__fixtures__/libraryStore';
import { bookRemoved, bookUpserted } from '../booksSlice';
import {
  selectBookProgress,
  selectBooksByLastPlayed,
  selectContinueListening,
  selectProgressLoaded,
} from '../progressSelectors';
import { progressChanged } from '../progressSlice';
import { loadLibraryProgress } from '../thunks';

const [A, B] = BOOK_IDS as [BookId, BookId];
const early = makeProgress({ updatedAt: '2026-11-01T00:00:00.000Z' });
const late = makeProgress({ updatedAt: '2026-11-02T00:00:00.000Z' });

describe('loadLibraryProgress', () => {
  it('reads every book in one call', async () => {
    const { store, listProgress } = createLibraryStore(
      [makeMeta(A), makeMeta(B)],
      { [B]: late },
    );
    expect(selectProgressLoaded(store.getState())).toBe(false);
    await store.dispatch(loadLibraryProgress());
    expect(listProgress.mock.calls).toEqual([[[A, B]]]);
    expect(selectProgressLoaded(store.getState())).toBe(true);
    expect(selectBookProgress(store.getState(), A)).toBeNull();
    expect(selectBookProgress(store.getState(), B)).toEqual(late);
  });

  it('keeps a newer change or reset and skips a book removed during the read', async () => {
    const [, , C] = BOOK_IDS as [BookId, BookId, BookId];
    const { store, listProgress } = createLibraryStore(
      [A, B, C].map(id => makeMeta(id)),
    );
    listProgress.mockImplementation(async () => {
      store.dispatch(progressChanged({ bookId: A, progress: late }));
      store.dispatch(progressChanged({ bookId: C, progress: null }));
      store.dispatch(bookRemoved(B));
      return { [A]: early, [B]: early, [C]: early };
    });
    await store.dispatch(loadLibraryProgress());
    expect(store.getState().libraryProgress.byBook).toEqual({
      [A]: late,
      [C]: null,
    });
  });

  it('opens the library even when the progress cannot be read', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    const { store, listProgress } = createLibraryStore([makeMeta(A)]);
    listProgress.mockRejectedValue(new Error('disk'));
    await store.dispatch(loadLibraryProgress());
    expect(selectProgressLoaded(store.getState())).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('libraryProgress', () => {
  it('sets, clears and drops the progress of a removed book', () => {
    const { store } = createLibraryStore([makeMeta(A), makeMeta(B)]);
    store.dispatch(progressChanged({ bookId: A, progress: early }));
    store.dispatch(progressChanged({ bookId: B, progress: late }));
    store.dispatch(progressChanged({ bookId: A, progress: null }));
    expect(selectBookProgress(store.getState(), A)).toBeNull();
    expect(selectBookProgress(store.getState(), B)).toEqual(late);
    store.dispatch(bookRemoved(B));
    expect(selectBookProgress(store.getState(), B)).toBeNull();
  });

  it('orders by last played and picks the card, memoized', () => {
    const { store } = createLibraryStore([makeMeta(A), makeMeta(B)]);
    expect(selectContinueListening(store.getState())).toBeNull();
    store.dispatch(progressChanged({ bookId: B, progress: late }));
    const sorted = selectBooksByLastPlayed(store.getState());
    expect(sorted.map(i => i.book.id)).toEqual([B, A]);
    expect(selectBooksByLastPlayed(store.getState())).toBe(sorted);
    expect(selectContinueListening(store.getState())?.book.id).toBe(B);
    store.dispatch(bookUpserted(makeMeta(B, { title: 'Ion' })));
    expect(selectContinueListening(store.getState())?.book.title).toBe('Ion');
  });
});
