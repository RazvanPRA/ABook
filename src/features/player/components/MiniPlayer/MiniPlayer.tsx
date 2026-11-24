import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { color, opacity, size, space } from '@/shared/theme';
import { AppText, BookCover, IconButton, ProgressBar } from '@/shared/ui';
import { useMiniPlayer } from './useMiniPlayer';

/** The book being played, above the tab bar of the other tabs. */
export const MiniPlayer = memo(function MiniPlayerView({
  onOpen,
}: {
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const mini = useMiniPlayer();
  if (mini === null) {
    return null;
  }
  const { book, chapter } = mini;
  return (
    <View style={styles.root} testID="mini-player">
      <ProgressBar
        value={mini.progress}
        accessibilityLabel={t('player.mini.progress')}
      />
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mini.open}
          onPress={onOpen}
          style={({ pressed }) => [styles.book, pressed && styles.pressed]}
        >
          <BookCover
            id={book.id}
            title={book.title}
            accessibilityLabel={mini.cover}
          />
          <View style={styles.text}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {book.title}
            </AppText>
            <AppText variant="caption" color="textMuted" numberOfLines={1}>
              {chapter}
            </AppText>
          </View>
        </Pressable>
        <IconButton {...mini.button} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { backgroundColor: color.surfaceRaised },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingRight: space.sm,
  },
  book: {
    flex: 1,
    minHeight: size.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingLeft: space.screenPadding,
    paddingVertical: space.sm,
  },
  pressed: { opacity: opacity.pressed },
  text: { flex: 1 },
});
