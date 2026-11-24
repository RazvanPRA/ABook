import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Bookmark } from '@/shared/domain';
import { color, size, space } from '@/shared/theme';
import { AppText, IconButton, PressableRow } from '@/shared/ui';

interface BookmarkRowProps {
  bookmark: Bookmark;
  onOpen: (bookmark: Bookmark) => void;
  onRemove: (id: string) => void;
}

/** A bookmark: its page and text listen from there, the button removes it. */
export const BookmarkRow = memo(function BookmarkRowView({
  bookmark,
  onOpen,
  onRemove,
}: BookmarkRowProps) {
  const { t } = useTranslation();
  const { id, page, excerpt } = bookmark;
  const open = useCallback(() => onOpen(bookmark), [onOpen, bookmark]);
  const remove = useCallback(() => onRemove(id), [onRemove, id]);
  const title = t('book.bookmarks.page', { page });
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <PressableRow label={`${title}, ${excerpt}`} onPress={open}>
          <View style={styles.target}>
            <AppText variant="caption" color="accent">
              {title}
            </AppText>
            <AppText numberOfLines={2}>{excerpt}</AppText>
          </View>
        </PressableRow>
      </View>
      <IconButton
        icon="trash"
        accessibilityLabel={t('book.bookmarks.remove', { page })}
        onPress={remove}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.divider,
  },
  text: { flex: 1 },
  target: {
    minHeight: size.touchTarget,
    justifyContent: 'center',
    gap: space.xs,
  },
});
