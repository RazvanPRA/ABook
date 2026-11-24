import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { chapterTitle } from '@/features/book';
import { IconButton, ScreenHeader } from '@/shared/ui';
import type { PlayerAppState } from '../../model/dependencies';
import { selectPlayerBook, selectSession } from '../../state/selectors';
import { selectPlayerToc } from '../../state/tocs';

interface PlayerHeaderProps {
  onClose: () => void;
  bookmark: { active: boolean; enabled: boolean; toggle: () => void };
}

/** The name of the chapter being read; empty until it is known. */
export function useCurrentChapterTitle(): string {
  const { t } = useTranslation();
  const { bookId, position } = useSelector(selectSession);
  const toc = useSelector((state: PlayerAppState) =>
    selectPlayerToc(state, bookId),
  );
  const chapter = toc[position?.chapter ?? -1];
  return chapter
    ? chapterTitle(chapter, number => t('book.chapters.untitled', { number }))
    : '';
}

/** Chevron, chapter and book, bookmark of the active sentence. */
export const PlayerHeader = memo(function PlayerHeaderView({
  onClose,
  bookmark,
}: PlayerHeaderProps) {
  const { t } = useTranslation();
  const book = useSelector(selectPlayerBook);
  const chapter = useCurrentChapterTitle();
  return (
    <ScreenHeader
      variant="compact"
      title={book?.title ?? ''}
      overline={chapter}
      back={{
        icon: 'chevron-down',
        accessibilityLabel: t('player.close'),
        onPress: onClose,
      }}
      right={
        <IconButton
          icon="bookmark"
          accessibilityLabel={t(
            bookmark.active ? 'player.bookmark.remove' : 'player.bookmark.add',
          )}
          active={bookmark.active}
          disabled={!bookmark.enabled}
          onPress={bookmark.toggle}
        />
      }
    />
  );
});
