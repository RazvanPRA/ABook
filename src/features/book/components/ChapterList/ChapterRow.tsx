import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Chapter, ChapterIndex } from '@/shared/domain';
import { size } from '@/shared/theme';
import { AppText, Icon, ListRow, PressableRow } from '@/shared/ui';
import type { ChapterStatus } from '../../services/deriveChapterStatus';
import { useChapterRow } from './useChapterRow';

interface ChapterRowProps {
  chapter: Chapter;
  status: ChapterStatus;
  onPlay: (index: ChapterIndex) => void;
}

/** A chapter of the table of contents; a tap listens from its start. */
export const ChapterRow = memo(function ChapterRowView({
  chapter,
  status,
  onPlay,
}: ChapterRowProps) {
  const { title, pages, label, look } = useChapterRow(chapter, status);
  const { index } = chapter;
  const play = useCallback(() => onPlay(index), [onPlay, index]);
  return (
    <PressableRow label={label} onPress={play} selected={status === 'current'}>
      <ListRow
        title={title}
        tone={look.tone}
        leading={
          <View style={styles.icon}>
            <Icon
              name={look.icon}
              size={status === 'pending' ? 'sm' : 'md'}
              color={look.iconColor}
            />
          </View>
        }
        trailing={
          <AppText variant="caption" color={look.pagesColor}>
            {pages}
          </AppText>
        }
      />
    </PressableRow>
  );
});

const styles = StyleSheet.create({
  /** One width for every status, so the titles line up. */
  icon: { width: size.icon.md, alignItems: 'center' },
});
