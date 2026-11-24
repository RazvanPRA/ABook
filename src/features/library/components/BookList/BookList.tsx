import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useSelector } from 'react-redux';
import type { BookId } from '@/shared/domain';
import { color, size, space } from '@/shared/theme';
import type { BookWithProgress } from '../../model/types';
import { selectVisibleBooks } from '../../state/filterSlice';
import { BookListItem } from '../BookListItem';
import { ContinueListeningCard } from '../ContinueListeningCard';
import { LibraryFilterChips } from '../LibraryFilterChips';
import { NoResults } from '../NoResults';

interface BookListProps {
  onOpen: (id: BookId) => void;
  onPlay: (id: BookId) => void;
}

const keyOf = ({ book }: BookWithProgress) => book.id;
const Divider = () => <View style={styles.divider} />;

/** The books that match, under the continue card and the filter. */
export function BookList({ onOpen, onPlay }: BookListProps) {
  const items = useSelector(selectVisibleBooks);
  const renderItem = useCallback<ListRenderItem<BookWithProgress>>(
    ({ item }) => <BookListItem item={item} onOpen={onOpen} />,
    [onOpen],
  );
  return (
    <FlashList
      testID="book-list"
      data={items}
      keyExtractor={keyOf}
      renderItem={renderItem}
      ItemSeparatorComponent={Divider}
      ListHeaderComponent={
        <View style={styles.header}>
          <ContinueListeningCard onPlay={onPlay} />
          <LibraryFilterChips />
        </View>
      }
      ListEmptyComponent={NoResults}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: space.cardGap, paddingBottom: space.sm },
  content: {
    paddingHorizontal: space.screenPadding,
    // The last row scrolls clear of the floating button
    paddingBottom: size.fab + space.screenPadding * 2,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.divider },
});
