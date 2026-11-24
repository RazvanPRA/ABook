import React from 'react';
import { View } from 'react-native';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { styles } from './Snackbar.styles';
import type { SnackbarProps } from './Snackbar.types';

/** A short message over the bottom of the screen, announced when it appears. Its owner hides it. */
export function Snackbar({ message, action }: SnackbarProps) {
  return (
    <View style={styles.base} accessibilityLiveRegion="polite">
      <AppText style={styles.message}>{message}</AppText>
      {action ? <Button variant="ghost" {...action} /> : null}
    </View>
  );
}
