import { useContext } from 'react';
import type { Theme } from './theme';
import { ThemeContext } from './ThemeProvider';

/** Returns the theme tokens. Throws outside `ThemeProvider` so a missing provider fails loudly. */
export function useTheme(): Theme {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
