import React from 'react';
import { View } from 'react-native';
import NativeSlider from '@react-native-community/slider';
import { color } from '@/shared/theme';
import { AppText } from '../AppText';
import { styles } from './Slider.styles';
import type { SliderProps } from './Slider.types';

/** Labelled slider row (Settings: speed, pitch; Player: page). Colors come from tokens. */
export function Slider({
  label,
  valueLabel,
  valueTone = 'accent',
  value,
  range,
  onChange,
  onComplete,
}: SliderProps) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppText>{label}</AppText>
        <AppText
          variant={valueTone === 'accent' ? 'bodyStrong' : 'body'}
          color={valueTone === 'accent' ? 'accent' : 'textMuted'}
        >
          {valueLabel}
        </AppText>
      </View>
      <NativeSlider
        accessibilityLabel={label}
        accessibilityValue={{ text: valueLabel }}
        value={value}
        minimumValue={range.min}
        maximumValue={range.max}
        step={range.step ?? 0}
        onValueChange={onChange}
        onSlidingComplete={onComplete}
        minimumTrackTintColor={color.accent}
        maximumTrackTintColor={color.border}
        thumbTintColor={color.accent}
        style={styles.slider}
      />
    </View>
  );
}
