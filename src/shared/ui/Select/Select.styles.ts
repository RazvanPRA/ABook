import { StyleSheet } from 'react-native';
import { color, opacity, radius, size, space } from '@/shared/theme';

export const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  value: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: space.screenPadding,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: color.bg,
    opacity: opacity.scrim,
  },
  sheet: {
    gap: space.xs,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: color.surfaceRaised,
  },
  title: { marginBottom: space.sm },
  option: {
    minHeight: size.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  optionLabel: { flex: 1 },
});
