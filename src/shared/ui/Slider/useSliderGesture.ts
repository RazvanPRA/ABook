import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import type { SliderDrag } from './useSliderTrack';

/** Sideways before it drags, so a list under the finger still scrolls. */
const SIDEWAYS = 4;
const UPWARDS = 12;

export const SLIDER_PAN = 'slider-pan';
export const SLIDER_TAP = 'slider-tap';

/** Drag, or tap where the thumb should be. */
export function useSliderGesture(
  { move, release, cancel }: SliderDrag,
  enabled: boolean,
) {
  return useMemo(() => {
    const pan = Gesture.Pan()
      .withTestId(SLIDER_PAN)
      .enabled(enabled)
      .runOnJS(true)
      .activeOffsetX([-SIDEWAYS, SIDEWAYS])
      .failOffsetY([-UPWARDS, UPWARDS])
      .onUpdate(({ x }) => move(x))
      .onEnd(({ x }, success) => (success ? release(x) : cancel()))
      .onFinalize(cancel);
    const tap = Gesture.Tap()
      .withTestId(SLIDER_TAP)
      .enabled(enabled)
      .runOnJS(true)
      .onEnd(({ x }, success) => {
        if (success) {
          release(x);
        }
      });
    return Gesture.Race(pan, tap);
  }, [move, release, cancel, enabled]);
}
