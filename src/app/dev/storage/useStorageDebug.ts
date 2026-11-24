import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bookRemoved, selectBooksInOrder } from '@/features/library';
import { useAppServices } from '../../providers/ServicesProvider';
import type { AppDispatch, RootState } from '../../store';
import { readStorageStats, type StorageStats } from './readStorageStats';

/** Dev only: storage stats plus delete-all / refresh actions, keeping the store in sync. */
export const useStorageDebug = () => {
  const services = useAppServices();
  const dispatch = useDispatch<AppDispatch>();
  const books = useSelector((state: RootState) => selectBooksInOrder(state));
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setStats(await readStorageStats(services, books));
  }, [services, books]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }, []);

  const deleteAll = useCallback(
    () =>
      run(async () => {
        for (const book of books) {
          await services.bookRepository.deleteBook(book.id);
          dispatch(bookRemoved(book.id));
        }
      }),
    [books, dispatch, run, services],
  );

  return { books, stats, busy, deleteAll, refresh };
};
