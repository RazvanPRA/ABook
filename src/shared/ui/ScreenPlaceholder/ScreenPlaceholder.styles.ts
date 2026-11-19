import { StyleSheet } from 'react-native';
import { color, space, type } from '@/shared/theme';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.screenPadding,
    backgroundColor: color.bg,
  },
  title: {
    ...type.display,
    color: color.text,
  },
  detail: {
    ...type.body,
    color: color.textMuted,
  },
});
