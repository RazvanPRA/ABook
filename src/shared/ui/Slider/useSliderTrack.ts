import { useCallback, useEffect, useRef } from 'react';
import type { AccessibilityActionEvent, LayoutChangeEvent } from 'react-native';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { size } from '@/shared/theme';
import type { SliderTrackProps } from './Slider.types';
import { fractionOf, stepFrom, valueAt } from './sliderValue';

const { thumb } = size.slider;

/** What the gesture tells the track: places in points, from its left edge. */
export interface SliderDrag {
  move(x: number): void;
  release(x: number): void;
  cancel(): void;
}

/** The thumb's place, the drag and the screen reader's steps. */
export function useSliderTrack(props: SliderTrackProps) {
  const latest = useRef(props);
  latest.current = props;
  const { value, range } = props;
  const fraction = useSharedValue(fractionOf(value, range));
  const width = useSharedValue(0);
  /** The value under the finger; `null` when nothing is dragged. */
  const dragged = useRef<number | null>(null);

  const shown = fractionOf(value, range);
  useEffect(() => {
    if (dragged.current === null) {
      fraction.value = shown;
    }
  }, [fraction, shown]);

  const move = useCallback(
    (x: number) => {
      const { range: within, value: before, onChange } = latest.current;
      const travel = Math.max(width.value - thumb, 1);
      const next = valueAt((x - thumb / 2) / travel, within);
      fraction.value = fractionOf(next, within);
      if (next !== (dragged.current ?? before)) {
        onChange?.(next);
      }
      dragged.current = next;
    },
    [fraction, width],
  );
  const release = useCallback(
    (x: number) => {
      move(x);
      const final = dragged.current;
      dragged.current = null;
      if (final !== null) {
        latest.current.onComplete?.(final);
      }
    },
    [move],
  );
  const cancel = useCallback(() => {
    if (dragged.current !== null) {
      dragged.current = null;
      fraction.value = fractionOf(latest.current.value, latest.current.range);
      latest.current.onChange?.(latest.current.value);
    }
  }, [fraction]);

  const onLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      width.value = nativeEvent.layout.width;
    },
    [width],
  );
  const onAction = useCallback(
    ({ nativeEvent: { actionName } }: AccessibilityActionEvent) => {
      const {
        value: now,
        range: within,
        disabled,
        onChange,
        onComplete,
      } = latest.current;
      const next = stepFrom(now, actionName === 'increment' ? 1 : -1, within);
      if (!disabled && next !== now) {
        onChange?.(next);
        onComplete?.(next);
      }
    },
    [],
  );
  const fillStyle = useAnimatedStyle(() => ({
    width: fraction.value * (width.value - thumb) + thumb / 2,
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: fraction.value * (width.value - thumb) }],
  }));
  return { move, release, cancel, onLayout, onAction, fillStyle, thumbStyle };
}
