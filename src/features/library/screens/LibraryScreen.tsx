import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { playbackRequested, type BookId } from '@/shared/domain';
import { color } from '@/shared/theme';
import { Fab } from '@/shared/ui';
import { BookList } from '../components/BookList';
import { LibraryEmpty } from '../components/LibraryEmpty';
import { LibraryHeader } from '../components/LibraryHeader';
import { LibrarySearch } from '../components/LibrarySearch';
import { LibrarySkeleton } from '../components/LibrarySkeleton';
import { selectProgressLoaded } from '../state/progressSelectors';
import { selectBookCount } from '../state/selectors';

export interface LibraryScreenProps {
  onImport: () => void;
  onSettings: () => void;
  onOpenBook: (id: BookId) => void;
  /** Leads to the player; what to play is already requested. */
  onPlay: () => void;
}

/** "Biblioteca mea": the books, or the first import (mockup 01). */
export function LibraryScreen({
  onImport,
  onSettings,
  onOpenBook,
  onPlay,
}: LibraryScreenProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const empty = useSelector(selectBookCount) === 0;
  const loaded = useSelector(selectProgressLoaded);
  const play = useCallback(
    (bookId: BookId) => {
      dispatch(playbackRequested({ bookId }));
      onPlay();
    },
    [dispatch, onPlay],
  );
  if (empty) {
    return (
      <View style={styles.screen} testID="screen-library">
        <LibraryHeader />
        <LibraryEmpty onImport={onImport} />
      </View>
    );
  }
  return (
    <View style={styles.screen} testID="screen-library">
      <LibraryHeader onSettings={onSettings} />
      <LibrarySearch />
      {loaded ? (
        <BookList onOpen={onOpenBook} onPlay={play} />
      ) : (
        <LibrarySkeleton />
      )}
      <Fab label={t('library.import')} icon="plus" onPress={onImport} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
});
