import React from 'react';
import { View } from 'react-native';
import { styles } from './ProgressBar.styles';
import type { ProgressBarProps } from './ProgressBar.types';
import { useProgressBar } from './useProgressBar';

export function ProgressBar({
  value,
  tone = 'accent',
  accessibilityLabel,
}: ProgressBarProps) {
  const { percent, fillWidth } = useProgressBar(value);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.track}
    >
      <View
        testID="progress-fill"
        style={[styles.fill, styles[tone], fillWidth]}
      />
    </View>
  );
}
