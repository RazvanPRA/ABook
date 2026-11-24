import { StyleSheet } from 'react-native';
import { opacity, space } from '@/shared/theme';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.md,
  },
  pressed: { opacity: opacity.pressed },
  text: { flex: 1, gap: space.xs },
});
