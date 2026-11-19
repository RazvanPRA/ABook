import { DarkTheme, type Theme } from '@react-navigation/native';
import { color } from '@/shared/theme';

/** React Navigation theme derived from the design tokens (keeps DarkTheme's fonts). */
export const navigationTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    primary: color.accent,
    background: color.bg,
    card: color.tabBar,
    text: color.text,
    border: color.divider,
    notification: color.accent,
  },
};
