import type { StyleProp, TextProps, TextStyle } from 'react-native';
import type { ColorToken, TypeVariant } from '@/shared/theme';

export interface AppTextProps extends Omit<TextProps, 'style'> {
  /** Type scale entry; defaults to `body`. */
  variant?: TypeVariant;
  /** Color token name (never a hex value); defaults to `text`. */
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
  /** Layout-only overrides (margins, flex). Typography and color come from the props above. */
  style?: StyleProp<TextStyle>;
}
