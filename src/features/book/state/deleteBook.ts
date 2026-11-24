import { cancelImportOf } from '@/features/import';
import { bookRemoved } from '@/features/library';
import type { BookRepository } from '@/repositories';
import type { BookId } from '@/shared/domain';
import { logger } from '@/shared/utils';
import type { BookThunk } from '../model/dependencies';
import {
  deletionFailed,
  deletionFinished,
  deletionStarted,
  selectDeletion,
} from './deletionSlice';

/** The repository's delete is idempotent, so a second run finishes what the first one started. */
async function deleteWithRetry(
  repository: BookRepository,
  id: BookId,
): Promise<void> {
  try {
    await repository.deleteBook(id);
  } catch (error) {
    logger.warn('book: delete failed, trying once more', error);
    await repository.deleteBook(id);
  }
}

/**
 * Deletes a book: the player lets go of it, its import (stopped and cleaned up first), then its keys and file, then the
 * library entry. Returns whether it worked; a failure stays in `bookDeletion` for the screen, and
 * whatever is left of a book already out of the stored library is swept at the next boot.
 */
export const deleteBook =
  (id: BookId): BookThunk<boolean> =>
  async (dispatch, getState, extra) => {
    if (selectDeletion(getState(), id) === 'deleting') {
      return false;
    }
    dispatch(deletionStarted(id));
    try {
      await extra.bookRelease.release(id, 'deleted');
      await dispatch(cancelImportOf(id));
      await deleteWithRetry(extra.bookRepository, id);
    } catch (error) {
      logger.warn('book: delete failed', error);
      dispatch(deletionFailed(id));
      return false;
    }
    dispatch(bookRemoved(id));
    dispatch(deletionFinished(id));
    return true;
  };
