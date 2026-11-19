import { color } from '@/shared/theme';
import { navigationTheme } from '../navigationTheme';

describe('navigationTheme', () => {
  it('is dark and built only from the design tokens', () => {
    expect(navigationTheme.dark).toBe(true);
    expect(navigationTheme.colors).toEqual({
      primary: color.accent,
      background: color.bg,
      card: color.tabBar,
      text: color.text,
      border: color.divider,
      notification: color.accent,
    });
  });

  it('keeps the font definitions React Navigation needs', () => {
    expect(navigationTheme.fonts.regular).toBeDefined();
    expect(navigationTheme.fonts.bold).toBeDefined();
  });
});
