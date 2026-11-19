import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../AppText';
import { feedback } from '../feedback.styles';
import { hitSlop, styles } from './Chip.styles';
import type { ChipProps } from './Chip.types';

export function Chip({
  label,
  selected = false,
  onPress,
  accessibilityRole = 'button',
}: ChipProps) {
  const text = (
    <AppText variant="caption" color={selected ? 'onAccent' : 'textMuted'}>
      {label}
    </AppText>
  );
  if (!onPress) {
    return (
      <View style={[styles.base, selected && styles.selected]}>{text}</View>
    );
  }
  const state =
    accessibilityRole === 'radio' ? { checked: selected } : { selected };
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityState={state}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && feedback.pressed,
      ]}
    >
      {text}
    </Pressable>
  );
}
