import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../AppText';
import { feedback } from '../feedback.styles';
import { styles, titleLook } from './ListRow.styles';
import type { ListRowProps } from './ListRow.types';

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  divider = true,
  tone = 'default',
}: ListRowProps) {
  const look = titleLook[tone];
  const rowStyle = [styles.row, divider && styles.divider];
  const content = (
    <>
      {leading}
      <View style={styles.text}>
        <AppText variant={look.variant} color={look.color}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textMuted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </>
  );
  if (!onPress) {
    return <View style={rowStyle}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [rowStyle, pressed && feedback.pressed]}
    >
      {content}
    </Pressable>
  );
}
