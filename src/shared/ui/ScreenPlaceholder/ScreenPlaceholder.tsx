import React from 'react';
import { View } from 'react-native';
import { AppText } from '../AppText';
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
      <AppText variant="display" accessibilityRole="header">
        {title}
      </AppText>
      {detail ? <AppText color="textMuted">{detail}</AppText> : null}
    </View>
  );
}
