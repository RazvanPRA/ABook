import { useEffect } from 'react';
import { AppState } from 'react-native';
import { playerBackgrounded } from '@/features/player';
import { flushSettings } from '@/features/settings';
import type { AppDispatch } from './store';

/** The app may be killed in background: what waits to be written is written when it goes there. */
export const useAppBackground = (dispatch: AppDispatch): void => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') {
        dispatch(playerBackgrounded());
        dispatch(flushSettings());
      }
    });
    return () => subscription.remove();
  }, [dispatch]);
};
