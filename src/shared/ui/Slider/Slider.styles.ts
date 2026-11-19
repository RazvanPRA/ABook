import { StyleSheet } from 'react-native';
import { size, space } from '@/shared/theme';

export const styles = StyleSheet.create({
  root: {
    gap: space.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: space.md,
  },
  slider: {
    height: size.touchTarget,
  },
});
