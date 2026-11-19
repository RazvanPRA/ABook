import React from 'react';
import { Pressable } from 'react-native';
import type { ColorToken } from '@/shared/theme';
import { feedback } from '../feedback.styles';
import { Icon } from '../Icon';
import { variantStyles } from './IconButton.styles';
import type { IconButtonProps } from './IconButton.types';

const tintFor = (filled: boolean, active: boolean): ColorToken => {
  if (filled) {
    return 'onAccent';
  }
  return active ? 'accent' : 'text';
};

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'plain',
  active = false,
  disabled = false,
}: IconButtonProps) {
  const filled = variant === 'filled';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        variantStyles[variant],
        pressed && feedback.pressed,
        disabled && feedback.disabled,
      ]}
    >
      <Icon
        name={icon}
        size={filled ? 'xl' : 'lg'}
        color={tintFor(filled, active)}
        filled={active || undefined}
      />
    </Pressable>
  );
}
