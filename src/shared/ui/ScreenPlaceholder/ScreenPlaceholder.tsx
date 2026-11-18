import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './ScreenPlaceholder.styles';
import type { ScreenPlaceholderProps } from './ScreenPlaceholder.types';

/** Temporary screen body used until each feature builds its real screen (M4–M6). */
export function ScreenPlaceholder({
  title,
  detail,
  testID,
}: ScreenPlaceholderProps) {
  return (
    <View style={styles.root} testID={testID}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}
