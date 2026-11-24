import { StyleSheet } from 'react-native';
import { color, size, space, type } from '@/shared/theme';

export const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: 0,
    paddingRight: space.xs,
  },
  input: {
    flex: 1,
    minHeight: size.touchTarget,
    paddingVertical: space.sm,
    fontFamily: type.body.fontFamily,
    fontSize: type.body.fontSize,
    color: color.text,
  },
});

export const placeholderColor = color.textMuted;
