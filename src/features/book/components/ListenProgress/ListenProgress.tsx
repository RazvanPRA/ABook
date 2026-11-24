import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { listenedPercent } from '@/features/library';
import type { BookMeta, Progress } from '@/shared/domain';
import { space } from '@/shared/theme';
import { AppText, ProgressBar } from '@/shared/ui';

interface ListenProgressProps {
  book: BookMeta;
  progress: Progress;
}

/** The listened share of the book; the bar carries the text for screen readers. */
export function ListenProgress({ book, progress }: ListenProgressProps) {
  const { t } = useTranslation();
  const percent = listenedPercent(book, progress);
  const text = t('book.listened', { percent });
  return (
    <View style={styles.row}>
      <View style={styles.bar}>
        <ProgressBar
          value={percent / 100}
          tone={progress.finished ? 'success' : 'accent'}
          accessibilityLabel={text}
        />
      </View>
      <AppText
        variant="caption"
        color="textMuted"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bar: { flex: 1 },
});
