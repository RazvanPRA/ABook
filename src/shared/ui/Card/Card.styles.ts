import { StyleSheet } from 'react-native';
import { color, radius, space } from '@/shared/theme';

export const styles = StyleSheet.create({
  base: {
    borderRadius: radius.cardLg,
    overflow: 'hidden',
  },
  surface: { backgroundColor: color.surface },
  raised: { backgroundColor: color.surfaceRaised },
  padded: { padding: space.lg },
  flush: { paddingHorizontal: space.lg },
});
