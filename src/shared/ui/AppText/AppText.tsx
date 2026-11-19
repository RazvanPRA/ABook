import React from 'react';
import { Text } from 'react-native';
import {
  alignStyles,
  colorStyles,
  defaultFontScale,
  variantStyles,
} from './AppText.styles';
import type { AppTextProps } from './AppText.types';

/** The only way text is rendered in the app: typography and color come from tokens. */
export function AppText({
  variant = 'body',
  color = 'text',
  align,
  style,
  maxFontSizeMultiplier,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? defaultFontScale[variant]}
      style={[
        variantStyles[variant],
        colorStyles[color],
        align ? alignStyles[align] : null,
        style,
      ]}
    />
  );
}
