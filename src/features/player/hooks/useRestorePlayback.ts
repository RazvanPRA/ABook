import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectProgressLoaded } from '@/features/book';
import { selectSession } from '../state/selectors';
import { restorePlayback } from '../state/thunks';
import { usePlayerDispatch } from './usePlayerDispatch';

/** The tab without a book opens the one to continue, paused. Returns `true` until it was tried. */
export function useRestorePlayback(): boolean {
  const dispatch = usePlayerDispatch();
  const loaded = useSelector(selectProgressLoaded);
  const idle = useSelector(selectSession).status === 'idle';
  const [tried, setTried] = useState(false);
  useEffect(() => {
    let current = true;
    if (!idle || !loaded) {
      setTried(false);
      return undefined;
    }
    dispatch(restorePlayback()).finally(() => {
      if (current) {
        setTried(true);
      }
    });
    return () => {
      current = false;
    };
  }, [dispatch, idle, loaded]);
  return idle && !tried;
}
