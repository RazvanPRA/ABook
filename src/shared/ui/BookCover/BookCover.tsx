import React, { memo } from 'react';
import { View } from 'react-native';
import { pickCoverColor, size as tokens } from '@/shared/theme';
import { AppText } from '../AppText';
import { backgroundFor, sizeStyles } from './BookCover.styles';
import type { BookCoverProps } from './BookCover.types';

/** Longest word that fits the large cover's width in the `title` size. */
const MAX_TITLE_WORD = 10;

const hasLongWord = (title: string): boolean =>
  title.split(/\s+/).some(word => word.length > MAX_TITLE_WORD);

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
          <AppText
            variant={hasLongWord(title) ? 'bodyStrong' : 'title'}
            maxFontSizeMultiplier={tokens.maxFontScaleHeader}
            numberOfLines={4}
          >
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
