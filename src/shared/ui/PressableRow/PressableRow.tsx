import React, { type PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';
import { feedback } from '../feedback.styles';

export type PressableRowProps = PropsWithChildren<{
  /** Already translated: the whole row, as screen readers say it. */
  label: string;
  onPress: () => void;
  /** Makes the row's current item `selected`. */
  selected?: boolean;
}>;

/** A list row that is one button: its parts are hidden from screen readers, the label says it all. */
export function PressableRow({
  label,
  onPress,
  selected,
  children,
}: PressableRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={({ pressed }) => pressed && feedback.pressed}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {children}
      </View>
    </Pressable>
  );
}
