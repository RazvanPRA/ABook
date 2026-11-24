import { StyleSheet } from 'react-native';
import { color, radius, size, space } from '@/shared/theme';

/** The box shared by `TextField` and `Select`: same height, outline and corner radius. */
export const fieldBox = StyleSheet.create({
  box: {
    // minHeight, not height: the text grows with the system font scale
    minHeight: size.input,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  focused: { borderColor: color.accent },
  invalid: { borderColor: color.danger },
  /** Label above the box and the box itself. */
  field: { gap: space.sm },
});
