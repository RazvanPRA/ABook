import { StyleSheet, type ViewStyle } from 'react-native';
import { color, radius, size, space, type ColorToken } from '@/shared/theme';
import type { ButtonSize, ButtonVariant } from './Button.types';

export const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
});

export const sizeStyles = StyleSheet.create<Record<ButtonSize, ViewStyle>>({
  md: {
    minHeight: size.touchTarget,
    paddingHorizontal: space.lg,
    borderRadius: radius.button,
  },
  lg: {
    minHeight: size.buttonLg,
    paddingHorizontal: space.xxl,
    borderRadius: radius.pill,
  },
});

export const variantStyles = StyleSheet.create<
  Record<ButtonVariant, ViewStyle>
>({
  primary: { backgroundColor: color.accent },
  secondary: { backgroundColor: color.surfaceRaised },
  ghost: { backgroundColor: 'transparent' },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: color.dangerBorder,
  },
});

/** Label, icon and spinner color per variant. */
export const contentColor: Record<ButtonVariant, ColorToken> = {
  primary: 'onAccent',
  secondary: 'text',
  ghost: 'accent',
  danger: 'danger',
};
