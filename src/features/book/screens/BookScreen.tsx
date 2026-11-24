import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectBookById, type LibraryRootState } from '@/features/library';
import type { BookId } from '@/shared/domain';
import { color } from '@/shared/theme';
import { ScreenPlaceholder } from '@/shared/ui';
import { MissingBook } from '../components/MissingBook';

export interface BookScreenProps {
  /** `null` when the link's id isn't one. */
  bookId: BookId | null;
  /** Leads to the Library tab. */
  onLibrary: () => void;
}

/** The navigator passes the route param in; the feature does not depend on navigation types. */
export function BookScreen({ bookId, onLibrary }: BookScreenProps) {
  const { t } = useTranslation();
  const book = useSelector((state: LibraryRootState) =>
    bookId === null ? null : selectBookById(state, bookId),
  );
  return (
    <View style={styles.screen} testID="screen-book">
      {book === null ? (
        <MissingBook onLibrary={onLibrary} />
      ) : (
        <ScreenPlaceholder title={t('book.title')} detail={book.title} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
});
