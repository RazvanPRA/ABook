import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { BookId } from '@/shared/domain';
import { space } from '@/shared/theme';
import { AppText, Card, IconButton, ProgressBar } from '@/shared/ui';
import { listenedPercent } from '../../services/listenedPercent';
import type { ContinueListening } from '../../services/pickContinueListening';
import { selectContinueListening } from '../../state/progressSelectors';

interface ContinueListeningCardProps {
  onPlay: (id: BookId) => void;
}

/** "Continuă ascultarea": the last played book that isn't finished; nothing without one. */
export function ContinueListeningCard({ onPlay }: ContinueListeningCardProps) {
  const current = useSelector(selectContinueListening);
  return current === null ? null : (
    <ContinueCard current={current} onPlay={onPlay} />
  );
}

function ContinueCard({
  current: { book, progress },
  onPlay,
}: {
  current: ContinueListening;
  onPlay: (id: BookId) => void;
}) {
  const { t } = useTranslation();
  const percent = listenedPercent(book, progress);
  const listened = t('library.status.listened', { percent });
  const play = useCallback(() => onPlay(book.id), [onPlay, book.id]);
  return (
    <Card variant="raised" testID="continue-card">
      <View style={styles.row}>
        <View style={styles.text}>
          <AppText variant="overline" color="accent">
            {t('library.continue.title')}
          </AppText>
          <AppText variant="title" numberOfLines={2}>
            {book.title}
          </AppText>
          <AppText variant="caption" color="textMuted">
            {t('library.continue.detail', { page: progress.page, percent })}
          </AppText>
        </View>
        <IconButton
          icon="play"
          variant="filled"
          accessibilityLabel={t('library.continue.play', { title: book.title })}
          onPress={play}
        />
      </View>
      <View style={styles.bar}>
        <ProgressBar value={percent / 100} accessibilityLabel={listened} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  text: { flex: 1, gap: space.xs },
  bar: { marginTop: space.lg },
});
