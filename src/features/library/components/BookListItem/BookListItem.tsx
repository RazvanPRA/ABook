import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import type { BookId } from '@/shared/domain';
import { AppText, BookCover, PressableRow, ProgressBar } from '@/shared/ui';
import type { BookWithProgress } from '../../model/types';
import { styles } from './BookListItem.styles';
import { useBookListItem } from './useBookListItem';

interface BookListItemProps {
  item: BookWithProgress;
  onOpen: (id: BookId) => void;
}

/** A book in the list. */
export const BookListItem = memo(function BookListItemView({
  item,
  onOpen,
}: BookListItemProps) {
  const { title, author, status, label } = useBookListItem(item);
  const { id } = item.book;
  const open = useCallback(() => onOpen(id), [onOpen, id]);
  return (
    <PressableRow label={label} onPress={open}>
      <View style={styles.row}>
        <BookCover id={id} title={title} accessibilityLabel={title} />
        <View style={styles.text}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {title}
          </AppText>
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {author}
          </AppText>
          {status.bar ? (
            <ProgressBar {...status.bar} accessibilityLabel={status.text} />
          ) : null}
          <AppText variant="caption" color={status.color}>
            {status.text}
          </AppText>
        </View>
      </View>
    </PressableRow>
  );
});
