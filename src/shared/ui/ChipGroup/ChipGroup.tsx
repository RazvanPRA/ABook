import React from 'react';
import { View } from 'react-native';
import { Chip } from '../Chip';
import { styles } from './ChipGroup.styles';
import type { ChipGroupProps } from './ChipGroup.types';
import { useChipGroup } from './useChipGroup';

/** Single-choice row of chips (library filter: Toate / În curs / Terminate). */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: ChipGroupProps<T>) {
  const items = useChipGroup({ options, value, onChange });
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={styles.row}
    >
      {items.map(item => (
        <Chip
          key={item.value}
          label={item.label}
          selected={item.selected}
          onPress={item.onPress}
          accessibilityRole="radio"
        />
      ))}
    </View>
  );
}
