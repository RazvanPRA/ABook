import { StyleSheet } from 'react-native';
import { opacity } from '@/shared/theme';

/** Press and disabled feedback shared by every pressable primitive. */
export const feedback = StyleSheet.create({
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
});
