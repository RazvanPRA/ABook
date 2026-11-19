import type { ColorToken, IconSize } from '@/shared/theme';
import type { IconName } from './icons';

export interface IconProps {
  name: IconName;
  /** Size token; defaults to `md` (20 pt). */
  size?: IconSize;
  /** Color token; defaults to `text`. */
  color?: ColorToken;
  /** Filled glyph (e.g. the play triangle on the accent button). */
  filled?: boolean;
  testID?: string;
}
