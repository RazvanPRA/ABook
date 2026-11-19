import { StyleSheet } from 'react-native';
import { color, radius, size, space } from '@/shared/theme';

const CHIP_HEIGHT = 32;
const extra = (size.touchTarget - CHIP_HEIGHT) / 2;

/** Extends the 32 pt chip to a 44 pt touch target. */
export const hitSlop = { top: extra, bottom: extra, left: 0, right: 0 };

export const styles = StyleSheet.create({
  base: {
    minHeight: CHIP_HEIGHT,
    paddingHorizontal: space.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: color.surface,
  },
  selected: {
    backgroundColor: color.accent,
  },
});
