import { color } from './colors';
import { duration, opacity } from './motion';
import { radius } from './radius';
import { size } from './sizes';
import { space } from './spacing';
import { type } from './typography';

/** All tokens in one object, as exposed by `useTheme()`. */
export const theme = {
  color,
  type,
  space,
  radius,
  size,
  duration,
  opacity,
} as const;

export type Theme = typeof theme;
