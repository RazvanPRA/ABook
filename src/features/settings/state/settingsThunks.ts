import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import type { AppDependencies } from '@/repositories';
import type { Settings } from '@/shared/domain';
import {
  createSettingsWriter,
  type SettingsWriter,
} from '../services/settingsWriter';
import { selectSettings, type SettingsRootState } from './selectors';
import { settingsChanged } from './settingsSlice';

export type SettingsDependencies = Pick<AppDependencies, 'settingsRepository'>;

export type SettingsThunk<Result = void> = ThunkAction<
  Result,
  SettingsRootState,
  SettingsDependencies,
  UnknownAction
>;

/** One writer for each store's dependencies. */
const writers = new WeakMap<SettingsDependencies, SettingsWriter>();

function writerOf(extra: SettingsDependencies): SettingsWriter {
  const writer =
    writers.get(extra) ?? createSettingsWriter(extra.settingsRepository);
  writers.set(extra, writer);
  return writer;
}

/** Applies at once, is stored a little later (`audiobook-storage` rule 5). */
export const changeSettings =
  (patch: Partial<Settings>): SettingsThunk =>
  (dispatch, getState, extra) => {
    dispatch(settingsChanged(patch));
    writerOf(extra).schedule(selectSettings(getState()));
  };

/** Stores what waits now: the app goes to the background. */
export const flushSettings =
  (): SettingsThunk<Promise<void>> => (_dispatch, _getState, extra) =>
    writerOf(extra).flush();
