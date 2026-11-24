import React from 'react';
import { View } from 'react-native';
import { AppText } from '../AppText';
import { styles } from './Slider.styles';
import type { SliderProps } from './Slider.types';
import { SliderTrack } from './SliderTrack';

/** Labelled slider row (Settings: speed, pitch). */
export function Slider({
  label,
  valueLabel,
  valueTone = 'accent',
  ...track
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
      <SliderTrack
        accessibilityLabel={label}
        valueText={valueLabel}
        {...track}
      />
    </View>
  );
}
