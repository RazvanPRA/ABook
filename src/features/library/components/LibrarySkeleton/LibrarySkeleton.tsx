import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { size, space } from '@/shared/theme';
import { Skeleton } from '@/shared/ui';

const CARD_HEIGHT = 132;
const ROWS = [0, 1, 2];

/** While the progress is read: a card and three rows. */
export function LibrarySkeleton() {
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityLabel={t('library.loading')}
      testID="library-skeleton"
      style={styles.root}
    >
      <Skeleton width="100%" height={CARD_HEIGHT} corner="cardLg" />
      {ROWS.map(row => (
        <View key={row} style={styles.row}>
          <Skeleton {...size.coverSm} corner="coverSm" />
          <View style={styles.text}>
            <Skeleton width="80%" height={space.lg} />
            <Skeleton width="50%" height={space.md} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.xl, paddingHorizontal: space.screenPadding },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  text: { flex: 1, gap: space.sm },
});
