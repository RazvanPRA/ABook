import React from 'react';
import { Pressable } from 'react-native';
import { size } from '@/shared/theme';
import { AppText } from '../AppText';
import { feedback } from '../feedback.styles';
import { Icon } from '../Icon';
import { styles } from './Fab.styles';
import type { FabProps } from './Fab.types';

/** The main action of a list screen, floating over its bottom right corner. */
export function Fab({ label, icon, onPress }: FabProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && feedback.pressed]}
    >
      <Icon name={icon} color="onAccent" />
      <AppText
        variant="bodyStrong"
        color="onAccent"
        maxFontSizeMultiplier={size.maxFontScaleHeader}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
