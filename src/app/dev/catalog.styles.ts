import { StyleSheet } from 'react-native';
import { color, space } from '@/shared/theme';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
  },
  content: {
    paddingHorizontal: space.screenPadding,
    paddingBottom: space.xxl * 2,
    gap: space.xxl,
  },
  section: {
    gap: space.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.md,
  },
  // Dev-only: Fab and Snackbar float over their parent
  floatingBox: {
    height: 96,
  },
  // Dev-only: EmptyState fills its parent (flex: 1), so the catalog gives it a phone-like height
  emptyStateBox: {
    height: 520,
  },
});
