import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { size, space } from '@/shared/theme';
import { Skeleton } from '@/shared/ui';

const ROWS = [0, 1, 2, 3];

/** While the book is read: the cover and four chapters. */
export function BookSkeleton() {
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityLabel={t('book.loading')}
      testID="book-skeleton"
      style={styles.root}
    >
      <Skeleton {...size.coverLg} corner="coverLg" />
      {ROWS.map(row => (
        <Skeleton key={row} width="100%" height={size.touchTarget} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: space.xl,
    paddingHorizontal: space.screenPadding,
  },
});
