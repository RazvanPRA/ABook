import React from 'react';
import { TextInput, View } from 'react-native';
import { AppText } from '../AppText';
import { feedback } from '../feedback.styles';
import { fieldBox } from '../field.styles';
import { placeholderColor, styles } from './TextField.styles';
import type { TextFieldProps } from './TextField.types';
import { useTextField } from './useTextField';

/**
 * Labelled single-line input (book title and author on the import form). The visible label is
 * hidden from screen readers, because the input carries it as its name; an error is read as the
 * input's hint and announced when it appears.
 */
export function TextField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  editable = true,
}: TextFieldProps) {
  const { focused, onFocus, onBlur } = useTextField();
  return (
    <View style={fieldBox.field}>
      <AppText
        color="textMuted"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? undefined}
        accessibilityState={{ disabled: !editable }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        editable={editable}
        onFocus={onFocus}
        onBlur={onBlur}
        style={[
          fieldBox.box,
          styles.input,
          focused && fieldBox.focused,
          error ? fieldBox.invalid : null,
          !editable && feedback.disabled,
        ]}
      />
      {error ? (
        <AppText
          variant="caption"
          color="danger"
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
