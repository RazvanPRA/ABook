import { configureStore } from '@reduxjs/toolkit';
import { libraryReducer } from '@/features/library';
import { settingsReducer } from '@/features/settings';
import type { AppDependencies } from '@/repositories';

/**
 * The single store. Slices are owned by features and mounted at the key their selectors expect
 * (`LibraryRootState`, `SettingsRootState`). Thunks receive the repositories as `extra`.
 */
export const createAppStore = (dependencies: AppDependencies) =>
  configureStore({
    reducer: {
      library: libraryReducer,
      settings: settingsReducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ thunk: { extraArgument: dependencies } }),
  });

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
