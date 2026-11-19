import type { Settings } from '@/shared/domain';
import type { SettingsState } from './settingsSlice';

/** The part of the root state this feature reads; the app's store must mount it at `settings`. */
export interface SettingsRootState {
  settings: SettingsState;
}

export const selectSettings = (state: SettingsRootState): Settings =>
  state.settings;
