import { libraryHydrated } from '@/features/library';
import { settingsHydrated } from '@/features/settings';
import type { BootResult } from '../bootstrap';
import type { AppDispatch } from './createAppStore';

/** Hands the boot result to the slices that own it, through their public actions. */
export const hydrateStore = (
  dispatch: AppDispatch,
  result: BootResult,
): void => {
  dispatch(libraryHydrated(result.books));
  dispatch(settingsHydrated(result.settings));
};
