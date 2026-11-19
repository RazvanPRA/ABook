import React, { memo } from 'react';
import { View } from 'react-native';
import { pickCoverColor } from '@/shared/theme';
import { AppText } from '../AppText';
import { backgroundFor, sizeStyles } from './BookCover.styles';
import type { BookCoverProps } from './BookCover.types';

/** Generated cover: author on top, title at the bottom (lg) or the title initial (sm). */
export const BookCover = memo(function BookCoverView({
  id,
  title,
  author,
  size = 'sm',
  accessibilityLabel,
}: BookCoverProps) {
  const background = backgroundFor.get(pickCoverColor(id));
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[sizeStyles[size], background]}
    >
      {size === 'lg' ? (
        <>
          <AppText variant="caption">{author}</AppText>
          <AppText variant="title" numberOfLines={4}>
            {title}
          </AppText>
        </>
      ) : (
        <AppText variant="title">
          {title.trim().charAt(0).toUpperCase()}
        </AppText>
      )}
    </View>
  );
});
