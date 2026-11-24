import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import {
  queryChanged,
  selectLibraryFilter,
  type LibraryFilterRootState,
} from '../state/filterSlice';

export const SEARCH_DEBOUNCE_MS = 200;

/**
 * The search text: shown as it is typed, applied to the list 200 ms after the last key; emptying it
 * applies at once. A change made elsewhere ("Șterge căutarea") shows in the field.
 */
export function useLibrarySearch() {
  const dispatch = useDispatch();
  const { query } = useSelector(selectLibraryFilter);
  const store = useStore<LibraryFilterRootState>();
  const [text, setText] = useState(query);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    setText(query);
  }, [query]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const change = useCallback(
    (next: string) => {
      setText(next);
      clearTimeout(timer.current);
      const apply = () => {
        if (selectLibraryFilter(store.getState()).query !== next) {
          dispatch(queryChanged(next));
        }
      };
      if (next === '') {
        apply();
      } else {
        timer.current = setTimeout(apply, SEARCH_DEBOUNCE_MS);
      }
    },
    [dispatch, store],
  );

  return { text, change };
}
