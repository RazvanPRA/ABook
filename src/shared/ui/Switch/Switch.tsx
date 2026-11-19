import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { feedback } from '../feedback.styles';
import { hitSlop, styles } from './Switch.styles';
import type { SwitchProps } from './Switch.types';
import { useSwitch } from './useSwitch';

/**
 * Custom switch: the mockup has a dark thumb on an amber track, which RN's Switch cannot draw.
 */
export function Switch({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
}: SwitchProps) {
  const { thumbStyle, toggle } = useSwitch({ value, onValueChange });
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={toggle}
      style={[
        styles.track,
        value ? styles.trackOn : styles.trackOff,
        disabled && feedback.disabled,
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          value ? styles.thumbOn : styles.thumbOff,
          thumbStyle,
        ]}
      />
    </Pressable>
  );
}
