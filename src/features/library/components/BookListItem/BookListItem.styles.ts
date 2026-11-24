import { StyleSheet } from 'react-native';
import { space } from '@/shared/theme';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.md,
  },
  text: { flex: 1, gap: space.xs },
});
