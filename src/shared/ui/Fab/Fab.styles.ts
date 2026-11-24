import { StyleSheet } from 'react-native';
import { color, radius, size, space } from '@/shared/theme';

export const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    right: space.screenPadding,
    bottom: space.screenPadding,
    minHeight: size.fab,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: color.accent,
  },
});
