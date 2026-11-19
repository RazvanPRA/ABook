import React, { createContext, type PropsWithChildren } from 'react';
import { theme, type Theme } from './theme';

export const ThemeContext = createContext<Theme | undefined>(undefined);

/**
 * Provides the (single, dark) theme. Styles still read the static tokens in `*.styles.ts`;
 * the context is the contract for components that need tokens at render time.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}
