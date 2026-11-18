import { StyleSheet } from 'react-native';
import { color, fontFamily } from '@/shared/theme';

// Temporary layout; spacing and type scale tokens arrive in M1.
export const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg,
  },
  title: { color: color.text, fontFamily: fontFamily.titleBold, fontSize: 28 },
  detail: { color: color.text, fontFamily: fontFamily.body, fontSize: 16 },
});
