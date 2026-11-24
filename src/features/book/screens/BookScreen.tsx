import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { BookId } from '@/shared/domain';
import { color } from '@/shared/theme';
import { BookDetails } from '../components/BookDetails';
import { MissingBook } from '../components/MissingBook';

export interface BookScreenProps {
  /** `null` when the link's id isn't one. */
  bookId: BookId | null;
  onBack: () => void;
  /** Leads to the Library tab. */
  onLibrary: () => void;
  /** Leads to the player; what to play is already requested. */
  onPlay: () => void;
}

/** The navigator passes the route param in; the feature does not depend on navigation types. */
export function BookScreen({ bookId, ...actions }: BookScreenProps) {
  return (
    <View style={styles.screen} testID="screen-book">
      {bookId === null ? (
        <MissingBook onLibrary={actions.onLibrary} />
      ) : (
        <BookDetails key={bookId} bookId={bookId} {...actions} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
});
