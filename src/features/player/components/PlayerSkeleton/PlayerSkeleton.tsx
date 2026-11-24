import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { space } from '@/shared/theme';
import { Skeleton } from '@/shared/ui';
import { TextCard } from '../TextCard';

const LINES = ['94%', '88%', '97%', '62%', '91%', '95%', '70%'] as const;
const LINE_HEIGHT = 16;

/** The text card while a chapter loads. */
export function PlayerSkeleton() {
  const { t } = useTranslation();
  return (
    <TextCard>
      <View
        accessible
        accessibilityLabel={t('player.text.loading')}
        accessibilityState={{ busy: true }}
        style={styles.lines}
      >
        {LINES.map(width => (
          <Skeleton key={width} width={width} height={LINE_HEIGHT} />
        ))}
      </View>
    </TextCard>
  );
}

const styles = StyleSheet.create({
  lines: { gap: space.lg, padding: space.xl },
});
