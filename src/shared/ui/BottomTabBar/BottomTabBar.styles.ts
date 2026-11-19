import { StyleSheet } from 'react-native';
import { color, size, space } from '@/shared/theme';

export const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: color.tabBar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.divider,
  },
  item: {
    flex: 1,
    minHeight: size.tabBarHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
});
