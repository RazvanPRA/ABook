import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BookId } from '@/shared/domain';

export type DeletionStatus = 'deleting' | 'failed';

/** Books being deleted, and those whose delete failed; a deleted book has no entry. */
export type BookDeletionState = Partial<Record<BookId, DeletionStatus>>;

/** The store must mount the slice at `bookDeletion`. */
export interface BookDeletionRootState {
  bookDeletion: BookDeletionState;
}

const initialState: BookDeletionState = {};

const deletionSlice = createSlice({
  name: 'bookDeletion',
  initialState,
  reducers: {
    deletionStarted: (state, { payload }: PayloadAction<BookId>) => {
      state[payload] = 'deleting';
    },
    deletionFailed: (state, { payload }: PayloadAction<BookId>) => {
      state[payload] = 'failed';
    },
    deletionFinished: (state, { payload }: PayloadAction<BookId>) => {
      delete state[payload];
    },
  },
});

export const { deletionStarted, deletionFailed, deletionFinished } =
  deletionSlice.actions;
export const bookDeletionReducer = deletionSlice.reducer;

export const selectDeletion = (
  state: BookDeletionRootState,
  id: BookId,
): DeletionStatus | null => state.bookDeletion[id] ?? null;
