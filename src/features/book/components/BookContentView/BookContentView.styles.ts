import { StyleSheet } from 'react-native';
import { size, space } from '@/shared/theme';

export const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    gap: space.xxl,
    paddingHorizontal: space.screenPadding,
    // The last button scrolls clear of the snackbar
    paddingBottom: size.input + space.screenPadding * 2,
  },
  listen: { gap: space.md },
});
