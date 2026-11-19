import { StyleSheet } from 'react-native';
import { color, radius, size } from '@/shared/theme';

export const styles = StyleSheet.create({
  track: {
    height: size.progressBar,
    borderRadius: radius.pill,
    backgroundColor: color.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  accent: { backgroundColor: color.accent },
  success: { backgroundColor: color.success },
  info: { backgroundColor: color.info },
});
