import React from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { styles } from './Slider.styles';
import type { SliderTrackProps } from './Slider.types';
import { useSliderGesture } from './useSliderGesture';
import { useSliderTrack } from './useSliderTrack';

/** The track alone, 44 pt high: drag or tap to set, one step at a time with a screen reader. */
export function SliderTrack(props: SliderTrackProps) {
  const {
    accessibilityLabel,
    valueText,
    value,
    range,
    disabled = false,
  } = props;
  const track = useSliderTrack(props);
  const gesture = useSliderGesture(track, !disabled);
  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        accessibilityValue={{
          min: range.min,
          max: range.max,
          now: value,
          text: valueText,
        }}
        accessibilityActions={ACTIONS}
        onAccessibilityAction={track.onAction}
        onLayout={track.onLayout}
        style={[styles.target, disabled && styles.disabled]}
      >
        <View style={styles.track}>
          <Animated.View style={[styles.fill, track.fillStyle]} />
        </View>
        <Animated.View style={[styles.thumb, track.thumbStyle]} />
      </View>
    </GestureDetector>
  );
}

const ACTIONS = [{ name: 'increment' }, { name: 'decrement' }];
