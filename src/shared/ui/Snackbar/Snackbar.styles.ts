import { StyleSheet } from 'react-native';
import { color, radius, size, space } from '@/shared/theme';

export const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    left: space.screenPadding,
    right: space.screenPadding,
    bottom: space.screenPadding,
    minHeight: size.input,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingLeft: space.lg,
    paddingVertical: space.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceRaised,
  },
  message: { flex: 1 },
});
