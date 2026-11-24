import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BookMeta } from '@/shared/domain';
import { space } from '@/shared/theme';
import { AppText, BookCover, Chip } from '@/shared/ui';
import { useBookMetaChips } from './useBookMetaChips';

/** Cover, title, author and metadata chips (mockup 03). */
export function BookHero({ book }: { book: BookMeta }) {
  const { t } = useTranslation();
  const chips = useBookMetaChips(book);
  const { id, title, author } = book;
  return (
    <View style={styles.root}>
      <BookCover
        id={id}
        title={title}
        author={author}
        size="lg"
        accessibilityLabel={t('book.cover', { title })}
      />
      <View style={styles.text}>
        <AppText variant="display" align="center" accessibilityRole="header">
          {title}
        </AppText>
        <AppText color="textMuted" align="center">
          {author === '' ? t('book.unknownAuthor') : author}
        </AppText>
      </View>
      <View style={styles.chips}>
        {chips.map(label => (
          <Chip key={label} label={label} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: space.lg },
  text: { gap: space.xs },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
  },
});
