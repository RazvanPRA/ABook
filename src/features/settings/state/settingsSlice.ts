import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_SETTINGS, type Settings } from '@/shared/domain';

export type SettingsState = Settings;

const settingsSlice = createSlice({
  name: 'settings',
  initialState: (): SettingsState => ({ ...DEFAULT_SETTINGS }),
  reducers: {
    /** Bootstrap: the stored settings (already merged with the defaults by the repository). */
    settingsHydrated: (_state, action: PayloadAction<Settings>) => ({
      ...action.payload,
    }),
  },
});

export const { settingsHydrated } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
