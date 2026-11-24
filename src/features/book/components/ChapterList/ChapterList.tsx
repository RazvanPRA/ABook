import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Chapter, ChapterIndex, Progress } from '@/shared/domain';
import { AppText } from '@/shared/ui';
import { deriveChapterStatus } from '../../services/deriveChapterStatus';
import { BookSection } from '../BookSection';
import { ChapterRow } from './ChapterRow';

interface ChapterListProps {
  toc: readonly Chapter[];
  progress: Progress | null;
  onPlay: (index: ChapterIndex) => void;
}

/** The table of contents, as far as the import saved it. */
export function ChapterList({ toc, progress, onPlay }: ChapterListProps) {
  const { t } = useTranslation();
  return (
    <BookSection title={t('book.chapters.title')}>
      {toc.length === 0 ? (
        <AppText color="textMuted">{t('book.chapters.empty')}</AppText>
      ) : null}
      {toc.map(chapter => (
        <ChapterRow
          key={chapter.index}
          chapter={chapter}
          status={deriveChapterStatus(chapter, progress)}
          onPlay={onPlay}
        />
      ))}
    </BookSection>
  );
}
