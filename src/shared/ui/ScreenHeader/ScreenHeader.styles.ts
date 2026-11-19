import { StyleSheet } from 'react-native';
import { size, space } from '@/shared/theme';

export const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.screenPadding,
    paddingBottom: space.md,
  },
  largeTitle: {
    flex: 1,
  },
  side: {
    minWidth: size.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
});
