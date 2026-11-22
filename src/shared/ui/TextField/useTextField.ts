import { useCallback, useState } from 'react';

/** Focus state of a text field, for the amber outline while typing. */
export function useTextField() {
  const [focused, setFocused] = useState(false);
  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);
  return { focused, onFocus, onBlur };
}
