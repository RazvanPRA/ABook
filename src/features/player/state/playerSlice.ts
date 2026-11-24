import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { bookRemoved } from '@/features/book';
import type { BookId } from '@/shared/domain';
import { IDLE, type SessionSnapshot } from '../services/session';

export interface PlayerState {
  /** The session's snapshot; the session itself is the only one that changes it. */
  session: SessionSnapshot;
  /** A book was asked for and is being read from storage. */
  opening: BookId | null;
}

/** The store must mount the slice at `player`. */
export interface PlayerRootState {
  player: PlayerState;
}

const initialState: PlayerState = { session: IDLE, opening: null };

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    sessionChanged: (state, action: PayloadAction<SessionSnapshot>) => ({
      ...state,
      session: action.payload,
    }),
    openingChanged: (state, action: PayloadAction<BookId | null>) => ({
      ...state,
      opening: action.payload,
    }),
  },
  extraReducers: builder => {
    builder.addCase(bookRemoved, (state, { payload }) => {
      if (state.opening === payload) {
        state.opening = null;
      }
    });
  },
});

export const { sessionChanged, openingChanged } = playerSlice.actions;
export const playerReducer = playerSlice.reducer;
