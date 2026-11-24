import { StyleSheet } from 'react-native';
import { space } from '@/shared/theme';

export const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  value: { flex: 1 },
});
