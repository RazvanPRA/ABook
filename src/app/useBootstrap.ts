import { useEffect, useRef, useState } from 'react';
import { resumeImports } from '@/features/import';
import { loadLibraryProgress } from '@/features/library';
import { logger } from '@/shared/utils';
import type { BootRepository } from '@/repositories';
import { bootstrap } from './bootstrap';
import { hydrateStore, type AppDispatch } from './store';

/**
 * Runs `bootstrap` once, hydrates the store and reports readiness, then reads the listening
 * progress and resumes in the background the imports a killed app left `processing` (the PDF host
 * is mounted outside the navigator, so it is there before readiness). Until readiness the app renders
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
      .then(result => {
        hydrateStore(dispatch, result);
        dispatch(loadLibraryProgress());
        dispatch(resumeImports(result.books)).catch(error =>
          logger.warn('Resume failed', error),
        );
      })
      .catch(error => logger.warn('Hydration failed', error))
      .finally(() => setReady(true));
  }, [boot, dispatch]);

  return ready;
};
