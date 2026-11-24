import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BookMeta } from '@/shared/domain';
import { AppText, Button, ScreenHeader } from '@/shared/ui';
import { CatalogSection } from '../CatalogSection';
import { styles } from '../catalog.styles';
import type { StorageStats } from './readStorageStats';
import { useStorageDebug } from './useStorageDebug';

/** Dev-only storage inspector (abook://dev/storage): real storage vs. the hydrated store. */
export function StorageDebugScreen() {
  const navigation = useNavigation();
  const { books, stats, busy, deleteAll, refresh } = useStorageDebug();
  return (
    <View style={styles.screen} testID="screen-dev-storage">
      <ScreenHeader
        title="Stocare"
        variant="compact"
        overline="M2 · storage"
        back={{
          icon: 'chevron-left',
          accessibilityLabel: 'Înapoi',
          onPress: () => navigation.goBack(),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Button
            label="Șterge tot"
            variant="danger"
            onPress={deleteAll}
            loading={busy}
          />
          <Button
            label="Reîncarcă"
            variant="secondary"
            onPress={refresh}
            disabled={busy}
          />
        </View>
        <StatsSection stats={stats} />
        <BooksSection books={books} stats={stats} />
      </ScrollView>
    </View>
  );
}

function StatsSection({ stats }: { stats: StorageStats | null }) {
  return (
    <CatalogSection title="AsyncStorage + fișiere">
      <AppText testID="storage-stats">
        {stats === null
          ? '…'
          : `schemaVersion ${stats.schemaVersion ?? '—'} · ${stats.keyCount} chei · ${stats.bookKeyCount} chei de carte`}
      </AppText>
      <AppText color="textMuted" testID="storage-files">
        {`books/: ${stats?.files.join(', ') || '(gol)'}`}
      </AppText>
    </CatalogSection>
  );
}

function BooksSection({
  books,
  stats,
}: {
  books: readonly BookMeta[];
  stats: StorageStats | null;
}) {
  return (
    <CatalogSection title={`Cărți în store (${books.length})`}>
      {books.map(book => (
        <AppText key={book.id} testID={`storage-book-${book.id}`}>
          {`${book.title} · ${book.status} · cap. 1: ${stats?.chapterOne[book.id] ?? '—'} fraze`}
        </AppText>
      ))}
    </CatalogSection>
  );
}
