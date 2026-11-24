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
    /** A change by the user, kept by `changeSettings`. */
    settingsChanged: (state, action: PayloadAction<Partial<Settings>>) => ({
      ...state,
      ...action.payload,
    }),
  },
});

export const { settingsHydrated, settingsChanged } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
