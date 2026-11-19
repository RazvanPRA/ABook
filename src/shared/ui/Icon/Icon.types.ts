import type { ColorToken, IconSize } from '@/shared/theme';
import type { IconName } from './icons';

export interface IconProps {
  name: IconName;
  /** Size token; defaults to `md` (20 pt). */
  size?: IconSize;
  /** Color token; defaults to `text`. */
  color?: ColorToken;
  /** Filled glyph; defaults to true for playback glyphs (play, pause). */
  filled?: boolean;
  testID?: string;
}
