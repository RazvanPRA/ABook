import { useCallback, useEffect } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { duration } from '@/shared/theme';
import { THUMB_TRAVEL } from './Switch.styles';
import type { SwitchProps } from './Switch.types';

/** Toggle handler plus the thumb position, animated on the UI thread. */
export function useSwitch({
  value,
  onValueChange,
}: Pick<SwitchProps, 'value' | 'onValueChange'>) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: duration.highlight,
    });
  }, [value, progress]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
  }));

  const toggle = useCallback(
    () => onValueChange(!value),
    [onValueChange, value],
  );

  return { thumbStyle, toggle };
}
