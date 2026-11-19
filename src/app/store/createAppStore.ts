import { configureStore } from '@reduxjs/toolkit';
import { importReducer } from '@/features/import';
import { libraryReducer } from '@/features/library';
import { settingsReducer } from '@/features/settings';
import type { FeatureDependencies } from '../dependencies';

/**
 * The single store. Slices are owned by features and mounted at the key their selectors expect
 * (`LibraryRootState`, `SettingsRootState`, `ImportRootState`). Thunks receive `FeatureDependencies` as `extra`.
 */
export const createAppStore = (dependencies: FeatureDependencies) =>
  configureStore({
    reducer: {
      library: libraryReducer,
      import: importReducer,
      settings: settingsReducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ thunk: { extraArgument: dependencies } }),
  });

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
