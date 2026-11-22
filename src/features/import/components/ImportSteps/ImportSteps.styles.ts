import { StyleSheet } from 'react-native';
import { color, radius, size, space } from '@/shared/theme';

const circle = {
  width: size.stepIndicator,
  height: size.stepIndicator,
  borderRadius: radius.pill,
  alignItems: 'center',
  justifyContent: 'center',
} as const;

export const styles = StyleSheet.create({
  card: { gap: space.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: size.touchTarget,
  },
  text: { flex: 1, gap: space.xs },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
  },
  title: { flex: 1 },
  done: { ...circle, backgroundColor: color.successBg },
  active: { ...circle, borderWidth: 2, borderColor: color.accent },
  activeDot: {
    width: size.stepIndicator / 3,
    height: size.stepIndicator / 3,
    borderRadius: radius.pill,
    backgroundColor: color.accent,
  },
  waiting: { ...circle, borderWidth: 2, borderColor: color.border },
  error: { ...circle, borderWidth: 2, borderColor: color.danger },
});
