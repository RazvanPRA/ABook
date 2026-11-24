import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Bookmark } from '@/shared/domain';
import { BookSection } from '../BookSection';
import { BookmarkRow } from './BookmarkRow';

interface BookmarkListProps {
  bookmarks: readonly Bookmark[];
  onOpen: (bookmark: Bookmark) => void;
  onRemove: (id: string) => void;
}

/** The book's bookmarks; nothing without any. */
export function BookmarkList({
  bookmarks,
  onOpen,
  onRemove,
}: BookmarkListProps) {
  const { t } = useTranslation();
  if (bookmarks.length === 0) {
    return null;
  }
  return (
    <BookSection title={t('book.bookmarks.title')}>
      {bookmarks.map(bookmark => (
        <BookmarkRow
          key={bookmark.id}
          bookmark={bookmark}
          onOpen={onOpen}
          onRemove={onRemove}
        />
      ))}
    </BookSection>
  );
}
