import { StyleSheet } from 'react-native';
import { color, opacity, radius, size, space } from '@/shared/theme';

export const styles = StyleSheet.create({
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
});

/** The look of what floats over the scrim: the sheet, its title and its rows. */
export const sheet = StyleSheet.create({
  box: {
    gap: space.xs,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: color.surfaceRaised,
  },
  title: { marginBottom: space.sm },
  row: {
    minHeight: size.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  rowLabel: { flex: 1 },
});
