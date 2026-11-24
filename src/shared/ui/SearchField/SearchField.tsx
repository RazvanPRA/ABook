import React, { useCallback } from 'react';
import { TextInput, View } from 'react-native';
import { fieldBox } from '../field.styles';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { useTextField } from '../TextField';
import { placeholderColor, styles } from './SearchField.styles';
import type { SearchFieldProps } from './SearchField.types';

/** A search box with a magnifier and, once something is typed, a button that empties it. */
export function SearchField({
  value,
  onChangeText,
  label,
  clearLabel,
}: SearchFieldProps) {
  const { focused, onFocus, onBlur } = useTextField();
  const clear = useCallback(() => onChangeText(''), [onChangeText]);
  return (
    <View style={[fieldBox.box, styles.box, focused && fieldBox.focused]}>
      <Icon name="search" color="textMuted" />
      <TextInput
        accessibilityRole="search"
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={placeholderColor}
        returnKeyType="search"
        autoCorrect={false}
        onFocus={onFocus}
        onBlur={onBlur}
        style={styles.input}
      />
      {value === '' ? null : (
        <IconButton icon="x" accessibilityLabel={clearLabel} onPress={clear} />
      )}
    </View>
  );
}
