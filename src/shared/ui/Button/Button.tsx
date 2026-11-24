import React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { color } from '@/shared/theme';
import { AppText } from '../AppText';
import { feedback } from '../feedback.styles';
import { Icon } from '../Icon';
import {
  contentColor,
  sizeStyles,
  styles,
  variantStyles,
} from './Button.styles';
import type { ButtonProps } from './Button.types';

/**
 * Android measures a label it has shown before a fraction too narrow (RN 0.88), and wraps its last
 * word out of sight. A no-break space makes room for the missing fraction; screen readers get
 * the accessibility label instead.
 */
const WIDTH_SLACK = String.fromCharCode(0xa0);

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
}: ButtonProps) {
  const inactive = disabled || loading;
  const tint = contentColor[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        pressed && feedback.pressed,
        disabled && feedback.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color[tint]} testID="button-spinner" />
      ) : null}
      {!loading && icon ? <Icon name={icon} color={tint} /> : null}
      <AppText variant="bodyStrong" color={tint}>
        {label}
        {WIDTH_SLACK}
      </AppText>
    </Pressable>
  );
}
