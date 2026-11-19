import React from 'react';
import { color as colors, size as sizes } from '@/shared/theme';
import { FILLED_BY_DEFAULT, icons } from './icons';
import type { IconProps } from './Icon.types';

const STROKE_WIDTH = 2;

/**
 * Lucide icon drawn from tokens. Always decorative: the control that contains it carries the
 * accessibility label, so the icon itself is hidden from screen readers.
 */
export function Icon({
  name,
  size = 'md',
  color = 'text',
  filled = FILLED_BY_DEFAULT.has(name),
  testID,
}: IconProps) {
  const Glyph = icons[name];
  const tint = colors[color];
  return (
    <Glyph
      testID={testID}
      size={sizes.icon[size]}
      color={tint}
      fill={filled ? tint : 'none'}
      strokeWidth={STROKE_WIDTH}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
