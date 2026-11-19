import { useEffect, useRef, useState } from 'react';
import { logger } from '@/shared/utils';
import type { BootRepository } from '@/repositories';
import { bootstrap } from './bootstrap';
import { hydrateStore, type AppDispatch } from './store';

/**
 * Runs `bootstrap` once, hydrates the store and reports readiness. Until then the app renders
 * nothing and the native splash stays up. `bootstrap` never rejects; the catch only guards the
 * hydration itself, and the app opens either way.
 */
export const useBootstrap = (
  boot: BootRepository,
  dispatch: AppDispatch,
): boolean => {
  const [ready, setReady] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    bootstrap(boot)
      .then(result => hydrateStore(dispatch, result))
      .catch(error => logger.warn('Hydration failed', error))
      .finally(() => setReady(true));
  }, [boot, dispatch]);

  return ready;
};
