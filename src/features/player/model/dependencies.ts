import type {
  ThunkAction,
  ThunkDispatch,
  UnknownAction,
} from '@reduxjs/toolkit';
import type { BookDependencies, BookRootState } from '@/features/book';
import type {
  SettingsDependencies,
  SettingsRootState,
} from '@/features/settings';
import type { PlaybackNotifier, TtsEngine } from '@/services/tts';
import type { PlayerRootState } from '../state/playerSlice';

/** What the player uses of `extra`: a part of the app's `FeatureDependencies`. */
export type PlayerDependencies = BookDependencies &
  SettingsDependencies & {
    ttsEngine: TtsEngine;
    playbackNotifier: PlaybackNotifier;
  };

/** The part of the root state this feature reads. */
export type PlayerAppState = PlayerRootState &
  BookRootState &
  SettingsRootState;

export type PlayerDispatch = ThunkDispatch<
  PlayerAppState,
  PlayerDependencies,
  UnknownAction
>;

export type PlayerThunk<Result = void> = ThunkAction<
  Result,
  PlayerAppState,
  PlayerDependencies,
  UnknownAction
>;

/** What a thunk and a listener both have. */
export interface PlayerStoreApi {
  readonly dispatch: PlayerDispatch;
  readonly getState: () => PlayerAppState;
  readonly extra: PlayerDependencies;
}
