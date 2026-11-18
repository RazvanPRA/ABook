import { StyleSheet } from 'react-native';
import { color, fontFamily, fontSize } from '@/shared/theme';

// Temporary placeholder layout; spacing tokens arrive with the design system in M1.
export const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg,
  },
  title: {
    color: color.text,
    fontFamily: fontFamily.titleBold,
    fontSize: fontSize.display,
  },
  detail: {
    color: color.text,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
  },
});
