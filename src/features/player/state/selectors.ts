import { selectBookById, type LibraryRootState } from '@/features/book';
import type { BookMeta } from '@/shared/domain';
import type { SessionSnapshot } from '../services/session';
import type { PlayerRootState } from './playerSlice';

export const selectSession = (state: PlayerRootState): SessionSnapshot =>
  state.player.session;

export const selectIsOpening = (state: PlayerRootState): boolean =>
  state.player.opening !== null;

/** The book being played, `null` when none is. */
export const selectPlayerBook = (
  state: PlayerRootState & LibraryRootState,
): BookMeta | null => {
  const { bookId } = state.player.session;
  return bookId === null ? null : selectBookById(state, bookId);
};

/** The player has a book: it takes the whole tab. */
export const selectPlayerHasBook = (state: PlayerRootState): boolean =>
  state.player.session.status !== 'idle' || state.player.opening !== null;
