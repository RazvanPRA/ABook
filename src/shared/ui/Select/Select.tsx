import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../AppText';
import { feedback } from '../feedback.styles';
import { fieldBox } from '../field.styles';
import { Icon } from '../Icon';
import { styles } from './Select.styles';
import type { SelectProps } from './Select.types';
import { SelectSheet } from './SelectSheet';
import { useSelect } from './useSelect';

/**
 * A labelled field that opens a list of options (the voice language on the import form). It looks
 * like `TextField`; screen readers get a combobox named by the label, with the chosen option as
 * its value and whether the list is open.
 */
export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  closeLabel,
  disabled = false,
}: SelectProps<T>) {
  const { open, show, hide, items, selectedLabel } = useSelect({
    options,
    value,
    onChange,
  });
  return (
    <View style={fieldBox.field}>
      <AppText
        color="textMuted"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {label}
      </AppText>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityValue={{ text: selectedLabel }}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={show}
        style={({ pressed }) => [
          fieldBox.box,
          styles.box,
          open && fieldBox.focused,
          pressed && feedback.pressed,
          disabled && feedback.disabled,
        ]}
      >
        <AppText style={styles.value}>{selectedLabel}</AppText>
        <Icon name="chevron-down" color="textMuted" />
      </Pressable>
      <SelectSheet
        visible={open}
        title={label}
        items={items}
        closeLabel={closeLabel}
        onClose={hide}
      />
    </View>
  );
}
