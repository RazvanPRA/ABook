import React from 'react';
import { View } from 'react-native';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { styles } from './EmptyState.styles';
import type { EmptyStateProps } from './EmptyState.types';

export function EmptyState({
  icon,
  title,
  description,
  action,
  note,
}: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size="xl" color="accent" />
      </View>
      <View style={styles.text}>
        <AppText variant="title" align="center" accessibilityRole="header">
          {title}
        </AppText>
        <AppText color="textMuted" align="center">
          {description}
        </AppText>
      </View>
      {action ? (
        <View style={styles.action}>
          <Button {...action} size="lg" />
        </View>
      ) : null}
      {note ? (
        <AppText variant="caption" color="textMuted" align="center">
          {note}
        </AppText>
      ) : null}
    </View>
  );
}
