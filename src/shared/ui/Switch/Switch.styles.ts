import { StyleSheet } from 'react-native';
import { color, radius, size } from '@/shared/theme';

const { width, height, thumb } = size.switch;
const inset = (height - thumb) / 2;

/** Horizontal distance the thumb travels from off to on. */
export const THUMB_TRAVEL = width - thumb - inset * 2;

/** Extends the 28 pt track to a 44 pt touch target. */
const extra = (size.touchTarget - height) / 2;
export const hitSlop = { top: extra, bottom: extra, left: 0, right: 0 };

export const styles = StyleSheet.create({
  track: {
    width,
    height,
    borderRadius: radius.pill,
    padding: inset,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: color.accent },
  trackOff: { backgroundColor: color.border },
  thumb: {
    width: thumb,
    height: thumb,
    borderRadius: radius.pill,
  },
  thumbOn: { backgroundColor: color.onAccent },
  thumbOff: { backgroundColor: color.textMuted },
});
