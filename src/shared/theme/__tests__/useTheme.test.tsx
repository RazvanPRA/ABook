import React, { type PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react-native';
import { theme } from '../theme';
import { ThemeProvider } from '../ThemeProvider';
import { useTheme } from '../useTheme';

const wrapper = ({ children }: PropsWithChildren) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('useTheme', () => {
  it('returns the theme tokens inside ThemeProvider', async () => {
    const { result } = await renderHook(() => useTheme(), { wrapper });
    expect(result.current).toBe(theme);
    expect(result.current.color.accent).toBe(theme.color.accent);
  });

  it('throws outside ThemeProvider', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(async () => {
      await renderHook(() => useTheme());
    }).rejects.toThrow('useTheme must be used inside ThemeProvider');
    spy.mockRestore();
  });
});
