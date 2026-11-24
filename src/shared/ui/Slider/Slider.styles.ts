import { StyleSheet } from 'react-native';
import { color, opacity, radius, size, space } from '@/shared/theme';

const { thumb, track } = size.slider;

export const styles = StyleSheet.create({
  root: {
    gap: space.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: space.md,
  },
  /** The touch target; the thumb stays inside it at both ends. */
  target: {
    height: size.touchTarget,
    justifyContent: 'center',
  },
  disabled: { opacity: opacity.disabled },
  track: {
    height: track,
    borderRadius: radius.pill,
    backgroundColor: color.border,
    overflow: 'hidden',
  },
  fill: {
    height: track,
    borderRadius: radius.pill,
    backgroundColor: color.accent,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: thumb,
    height: thumb,
    borderRadius: radius.pill,
    backgroundColor: color.accent,
  },
});
