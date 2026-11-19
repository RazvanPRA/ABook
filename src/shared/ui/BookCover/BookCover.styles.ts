import { StyleSheet, type ViewStyle } from 'react-native';
import { color, radius, size, space } from '@/shared/theme';
import type { BookCoverSize } from './BookCover.types';

export const sizeStyles = StyleSheet.create<Record<BookCoverSize, ViewStyle>>({
  sm: {
    ...size.coverSm,
    borderRadius: radius.coverSm,
    padding: space.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lg: {
    ...size.coverLg,
    borderRadius: radius.coverLg,
    padding: space.lg,
    justifyContent: 'space-between',
  },
});

/** One precomputed background per cover color. */
export const backgroundFor: ReadonlyMap<string, ViewStyle> = new Map(
  color.cover.map(hex => [hex, { backgroundColor: hex }]),
);
