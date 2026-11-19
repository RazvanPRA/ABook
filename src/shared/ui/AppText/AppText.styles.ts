import { StyleSheet, type TextStyle } from 'react-native';
import {
  color,
  size,
  type,
  type ColorToken,
  type TypeVariant,
} from '@/shared/theme';

export const variantStyles = StyleSheet.create(type);

const colorNames = Object.keys(color).filter(
  (k): k is ColorToken => k !== 'cover',
);

/** One precomputed `{ color }` style per token, so nothing is allocated at render time. */
export const colorStyles = StyleSheet.create(
  Object.fromEntries(colorNames.map(k => [k, { color: color[k] }])) as Record<
    ColorToken,
    TextStyle
  >,
);

export const alignStyles = StyleSheet.create({
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
});

/** Headers stop scaling at 1.4× (PROMPT §8); other text follows the system font size freely. */
export const defaultFontScale: Record<TypeVariant, number | undefined> = {
  display: size.maxFontScaleHeader,
  title: size.maxFontScaleHeader,
  body: undefined,
  bodyStrong: undefined,
  caption: undefined,
  overline: undefined,
};
