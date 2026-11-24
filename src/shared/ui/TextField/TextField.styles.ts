import { StyleSheet } from 'react-native';
import { color, type } from '@/shared/theme';

export const styles = StyleSheet.create({
  input: {
    fontFamily: type.body.fontFamily,
    fontSize: type.body.fontSize,
    color: color.text,
  },
});

export const placeholderColor = color.textMuted;
