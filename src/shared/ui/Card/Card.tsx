import React from 'react';
import { View } from 'react-native';
import { styles } from './Card.styles';
import type { CardProps } from './Card.types';

export function Card({
  variant = 'surface',
  padded = true,
  testID,
  children,
}: CardProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.base,
        styles[variant],
        padded ? styles.padded : styles.flush,
      ]}
    >
      {children}
    </View>
  );
}
