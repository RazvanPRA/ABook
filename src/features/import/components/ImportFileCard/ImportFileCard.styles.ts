import { StyleSheet } from 'react-native';
import { color, radius, size, space } from '@/shared/theme';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  badge: {
    width: size.fileBadge,
    height: size.fileBadge,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: space.xs / 2 },
});
