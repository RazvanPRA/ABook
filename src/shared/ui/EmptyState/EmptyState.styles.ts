import { StyleSheet } from 'react-native';
import { color, radius, size, space } from '@/shared/theme';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    paddingHorizontal: space.screenPadding,
  },
  iconCircle: {
    width: size.emptyStateIcon,
    height: size.emptyStateIcon,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  text: {
    alignItems: 'center',
    gap: space.sm,
  },
  action: {
    marginTop: space.sm,
  },
});
