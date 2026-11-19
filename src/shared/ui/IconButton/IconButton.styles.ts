import { StyleSheet, type ViewStyle } from 'react-native';
import { color, radius, size } from '@/shared/theme';
import type { IconButtonVariant } from './IconButton.types';

export const variantStyles = StyleSheet.create<
  Record<IconButtonVariant, ViewStyle>
>({
  plain: {
    width: size.touchTarget,
    height: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    width: size.playButton,
    height: size.playButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.accent,
  },
});
